<template>
  <b-tab-item label="POA" header-class="button_tab_poa">
    <div class="poa-container">
      <div class="poa-header">
        <h2 class="poa-title">Generate POA</h2>
        <div class="poa-subtitle">What is POA?</div>
      </div>

      <div class="field poa-field">
        <b-input
          v-model="withdrawNote"
          placeholder="Enter Note"
          :custom-class="hasErrorNote ? 'has-error' : ''"
          data-test="enter_note_field"
          class="poa-input"
        ></b-input>
      </div>

      <div class="field poa-field">
        <b-input
          v-model="withdrawAddress"
          placeholder="Enter recipient address"
          :custom-class="!isValidAddress && withdrawAddress ? 'has-error' : ''"
          data-test="recipient_field"
          class="poa-input"
        ></b-input>
      </div>

      <div v-if="hasErrorNote" class="help error-msg">
        {{ hasErrorNote.msg }}
      </div>
      <div v-if="error.message" class="help error-msg">
        {{ error.message }}
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="modal-success">
        <button class="modal-close" @click="closeSuccessModal">&times;</button>
        <div class="modal-title">
          You have <span class="success-text">generated</span> your<br />
          Proof of Association
        </div>
        <div class="modal-details">
          <div class="detail-row">
            <span class="label">From:</span>
            <span class="value">{{ formatAddress(proofDetails.from) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">To:</span>
            <span class="value">{{ formatAddress(proofDetails.to) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fees:</span>
            <span class="value">{{ proofDetails.fees }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fee collector:</span>
            <span class="value">{{ formatAddress(proofDetails.feeCollector) }}</span>
          </div>
        </div>
        <div class="modal-buttons">
          <button class="primary" @click="viewTransaction">View Transaction</button>
          <button class="secondary" @click="viewRegistry">View Registry</button>
        </div>
      </div>
    </div>

    <!-- Failure Modal -->
    <div v-if="showFailureModal" class="modal-overlay" @click.self="closeFailureModal">
      <div class="modal-failure">
        <button class="modal-close" @click="closeFailureModal">&times;</button>
        <div class="modal-title">
          Your Proof of Association<br />
          has <span class="failure-text">failed</span>
        </div>
        <div class="modal-details">
          <div class="detail-row">
            <span class="label">From:</span>
            <span class="value">{{ formatAddress(proofDetails.from) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">To:</span>
            <span class="value">{{ formatAddress(proofDetails.to) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fees:</span>
            <span class="value">{{ proofDetails.fees }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fee collector:</span>
            <span class="value">{{ formatAddress(proofDetails.feeCollector) }}</span>
          </div>
        </div>
        <div class="modal-buttons">
          <button class="primary" @click="viewTransaction">View Transaction</button>
        </div>
      </div>
    </div>
    <div v-if="!hasErrorNote && depositTxHash" class="field field-withdraw">
      <div class="withdraw-data">
        <div class="withdraw-data-item">
          {{ $t('amount') }}
          <span data-test="note_tokens_amount">{{ selectedAmount }} {{ selectedStatisticCurrency }}</span>
        </div>
        <div class="withdraw-data-item">
          {{ $t('timePassed') }}
          <b-tooltip
            :active="notEnoughPassedTime"
            :label="$t('timePassedTooltip')"
            position="is-left"
            multilined
            size="is-large"
            :class="{ 'has-low-anonymity': notEnoughPassedTime }"
          >
            <span>{{ timePassed }}</span>
          </b-tooltip>
        </div>
        <div class="withdraw-data-item">
          {{ $t('subsequentDeposits') }}
          <b-tooltip
            :active="notEnoughDeposits"
            :label="$t('subsequentDepositsTooltip')"
            position="is-left"
            multilined
            size="is-large"
            :class="{ 'has-low-anonymity': notEnoughDeposits }"
          >
            <span>{{ this.$tc('userDeposit', depositsPast) }}</span>
          </b-tooltip>
        </div>
      </div>
    </div>
    <div class="poa-button-container">
      <connect-button
        v-if="!isLoggedIn"
        type="is-primary is-fullwidth"
        class="poa-connect-btn"
        action-text="connect"
      />
      <b-button
        v-else
        type="is-primary is-fullwidth"
        class="poa-generate-btn"
        :disabled="isProvingButtonDisable || !withdrawNote || !withdrawAddress"
        :loading="isLoading"
        data-test="button_start_innocenceproof"
        @click="onProveInnocence"
      >
        Generate POA
      </b-button>
    </div>
  </b-tab-item>
</template>

<script>
/* eslint-disable no-console */
import { mapState, mapGetters, mapActions } from 'vuex'
import { getTornadoKeys } from '@/store/snark'

import { parseNote } from '@/utils'
import { DONATIONS_ADDRESS } from '@/constants'

import SettingsModalBox from '@/components/settings/SettingsModalBox'
import { ConnectButton } from '@/components/web3Connect'

const { isHexStrict, isAddress } = require('web3-utils')

export default {
  components: {
    ConnectButton
  },
  data() {
    return {
      withdrawAddress: '',
      withdrawNote: '',
      depositsPast: null,
      depositTxHash: null,
      depositTimestamp: null,
      isSpent: false,
      isLoading: false,
      isFileError: false,
      error: {
        type: null,
        message: ''
      },
      timePassed: '',
      showSuccessModal: false,
      showFailureModal: false,
      proofDetails: {
        from: '',
        to: '',
        fees: '0.0075 xDAI (~ $0.00)',
        feeCollector: '0xbow (0x1a2b...3c4d)'
      }
    }
  },
  computed: {
    ...mapState('application', ['note', 'withdrawType', 'ethToReceive']),
    ...mapState('relayer', ['isLoadingRelayers']),
    ...mapGetters('txHashKeeper', ['txExplorerUrl']),
    ...mapGetters('application', ['isNotEnoughTokens', 'selectedStatisticCurrency']),
    ...mapGetters('metamask', ['networkConfig', 'netId', 'isLoggedIn', 'nativeCurrency']),
    notEnoughDeposits() {
      if (this.depositsPast < 5) {
        return true
      }
      return false
    },
    shouldSettingsShow() {
      return !this.hasErrorNote && !this.error.message
    },
    hasErrorNote() {
      const note = this.withdrawNote.split('-')[4]
      if (typeof WebAssembly === 'undefined') {
        return {
          type: 'is-warning',
          msg: this.$t('turnOnWasm')
        }
      }
      if (!this.withdrawNote) {
        return { type: '', msg: '' }
      }
      if (!note || note.length < 126 || !isHexStrict(note)) {
        return { type: 'is-warning', msg: this.$t('noteIsInvalid') }
      }
      return false
    },
    withDisconnectedWallet() {
      return this.withdrawType === 'wallet' && !this.isLoggedIn
    },
    shouldTooltipShow() {
      return (!this.isWithdrawDisabled && this.isNotEnoughTokens) || this.withDisconnectedWallet
    },
    tooltipText() {
      if (this.withDisconnectedWallet) {
        return 'withDisconnectedWallet'
      }
      return 'notEnoughTokens'
    },
    isValidAddress() {
      return isAddress(this.withdrawAddress)
    },
    notEnoughPassedTime() {
      return this.$moment().unix() - Number(this.depositTimestamp) < 86400 // less than 24 hours
    },
    hasWarning() {
      return this.depositsPast < 5 || this.notEnoughPassedTime
    },
    isProvingDisabled() {
      return this.isLoading || !!this.error.type || this.hasErrorNote || this.withdrawType === 'relayer'
    },
    isProvingButtonDisable() {
      return (
        this.isProvingDisabled || this.isNotEnoughTokens || this.isFileError || this.withDisconnectedWallet
      )
    },
    selectedAmount() {
      return this.$store.state.application.selectedStatistic.amount
    },
    tokens() {
      return this.networkConfig.tokens
    },
    shouldShowTotal() {
      return this.isValidAddress && !this.isWithdrawDisabled
    },
    shouldShowRelayerTotal() {
      return this.withdrawType === 'relayer' && this.shouldShowTotal
    }
  },
  watch: {
    netId(netId, oldNetId) {
      if (netId !== oldNetId) {
        const [, , , noteNetId] = this.withdrawNote.split('-')

        if (Number(noteNetId) !== netId && noteNetId) {
          this.error = {
            type: this.$t('error'),
            message: this.$t('changeNetworkNote')
          }
        } else {
          this.error = {
            type: '',
            message: ''
          }
        }
      }
    },
    withdrawNote: {
      async handler(withdrawNote) {
        this.error = {
          type: '',
          message: ''
        }

        try {
          this.$store.dispatch('loading/enable', { message: this.$t('gettingTheNoteData') })
          this.isSpent = false
          this.depositsPast = null
          this.depositTxHash = null
          this.depositTimestamp = null

          if (!this.hasErrorNote) {
            const [tornadoPrefix, currency, amount, noteNetId, note] = this.withdrawNote.split('-')
            if (tornadoPrefix !== 'tornado') {
              this.$store.dispatch('loading/disable')
              this.withdrawNote = `tornado-${currency}-${amount}-${noteNetId}-${note}`
              return
            }
            this.getLogs(withdrawNote)
            this.$store.commit('application/SET_WITHDRAW_NOTE', withdrawNote)
            const netIdMissmatch = Number(noteNetId) !== Number(this.netId)

            if (netIdMissmatch) {
              throw new Error(this.$t('changeNetworkNote'))
            }

            const event = await this.$store.dispatch('application/loadDepositEvent', { withdrawNote })

            if (!event) {
              throw new Error(this.$t('thereIsNoRelatedDeposit'))
            }

            const { timestamp, txHash, isSpent, depositsPast = 0 } = event

            if (isSpent) {
              this.$store.dispatch('notice/addNoticeWithInterval', {
                notice: {
                  title: 'noteWasAlreadySpent',
                  type: 'warning'
                },
                interval: 5000
              })
            }
            this.$store.dispatch('application/setAndUpdateStatistic', { currency, amount: Number(amount) })
            if (currency !== this.nativeCurrency) {
              this.$store.dispatch('application/setDefaultEthToReceive', { currency })
            }
            this.$store.dispatch('loading/updateProgress', { progress: -1 })
            this.depositsPast = Number(depositsPast) <= 0 ? 0 : depositsPast
            this.depositTxHash = txHash
            this.depositTimestamp = timestamp
            this.isSpent = isSpent
          }
        } catch (err) {
          this.error = {
            type: this.$t('error'),
            message: err.message
          }
        } finally {
          this.$store.dispatch('loading/disable')
        }
      }
    },
    '$i18n.locale'() {
      this.timePastToRender()
    },
    depositTimestamp() {
      this.timePastToRender()
    },
    activeTab(newTab, oldTab) {
      if (newTab !== oldTab && newTab === 1) {
        this.withdrawAddress = ''
        this.withdrawNote = ''
        this.error = {
          type: '',
          message: ''
        }
      }
    }
  },
  created() {
    console.log('Withdraw::created')
    this.$emit('get-key', this.getKeys)
  },
  mounted() {
    console.log('Withdraw::mounted')
    this.$root.$on('resetWithdraw', () => {
      this.withdrawAddress = ''
      this.withdrawNote = ''
    })
    this.getPoiFeeBPS()
    this.$store.dispatch('application/getPoiFeeBPS')
  },
  methods: {
    ...mapActions('application', ['getPoiFeeBPS']),
    async getKeys() {
      try {
        this.isFileError = false
        this.isLoading = true
        this.getProgress(0)
        await getTornadoKeys(this.getProgress)
        return true
      } catch (err) {
        console.error('getKeys has error:', err.message)

        this.$store.dispatch(
          'notice/addNoticeWithInterval',
          {
            notice: {
              title: 'fetchFile',
              type: 'warning'
            }
          },
          { root: true }
        )
        this.error = {
          type: this.$t('downloadError'),
          message: this.$t('fetchFile')
        }
        this.isFileError = true
      } finally {
        this.isLoading = false
      }
    },
    getProgress(value) {
      document.documentElement.style.setProperty('--width-animation', `${value}%`)
    },
    getLogs(note) {
      try {
        if (!note) {
          return
        }

        const { commitmentHex, nullifierHex } = parseNote(note)

        console.log('\n\nYOUR NOTE DATA:')
        console.log('note:', note)

        console.log('commitment:', commitmentHex)
        console.log('nullifierHash:', nullifierHex)
      } catch (err) {
        console.log(`Get logs: ${err.message}`)
      }
    },
    async onProveInnocence() {
      console.log('ProveInnocence::onProveInnocence')
      const note = this.withdrawNote.split('-')[4]
      if (note.length !== 126) {
        this.error = {
          type: this.$t('validationError'),
          message: this.$t('noteIsInvalid')
        }
        return
      }

      try {
        this.$store.dispatch('loading/enable', { message: this.$t('generatingProof') })

        await this.$store.dispatch('application/prepareInnocenceProof', {
          note: this.withdrawNote,
          recipient: this.withdrawAddress
        })

        // Set proof details
        this.proofDetails.from = this.withdrawAddress || '0x2ac1...5bd6'
        this.proofDetails.to = this.withdrawAddress || '0x2ac1...5bd6'

        // Simulate success/failure - In real app, this would depend on the proof result
        const isSuccess = Math.random() > 0.5 // For demo, randomly show success or failure

        if (isSuccess) {
          this.showSuccessModal = true
        } else {
          this.showFailureModal = true
        }
      } catch (err) {
        this.error = {
          type: this.$t('error'),
          message: err.message
        }
        this.showFailureModal = true
        this.proofDetails.from = this.withdrawAddress || '0x2ac1...5bd6'
        this.proofDetails.to = this.withdrawAddress || '0x2ac1...5bd6'
      } finally {
        this.$store.dispatch('loading/disable')
      }
    },
    onSettings() {
      this.$buefy.modal.open({
        parent: this,
        component: SettingsModalBox,
        hasModalCard: true,
        width: 440,
        props: {
          currency: this.selectedStatisticCurrency
        },
        customClass: 'is-pinned'
      })
    },
    timePastToRender() {
      this.timePassed = this.$moment.unix(this.depositTimestamp).fromNow(true)
    },
    insertDonate() {
      this.withdrawAddress = DONATIONS_ADDRESS
    },
    closeSuccessModal() {
      this.showSuccessModal = false
      this.$root.$emit('resetWithdraw')
    },
    closeFailureModal() {
      this.showFailureModal = false
    },
    formatAddress(address) {
      if (!address) return ''
      if (address.length > 15) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
      }
      return address
    },
    viewTransaction() {
      // Open transaction in explorer
      if (this.depositTxHash) {
        window.open(this.txExplorerUrl(this.depositTxHash), '_blank')
      }
      this.closeSuccessModal()
      this.closeFailureModal()
    },
    viewRegistry() {
      this.$router.push('/proof-of-innocence')
      this.closeSuccessModal()
    }
  }
}
</script>
<style lang="scss" scoped>
.poa-container {
  padding: 2rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.poa-header {
  margin-bottom: 2rem;
}

.poa-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
}

.poa-subtitle {
  color: #666;
  cursor: pointer;
  text-decoration: underline;
}

.poa-field {
  margin-bottom: 1rem;
}

.poa-input {
  ::v-deep input {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    color: #333;

    &:focus {
      border-color: #000;
      box-shadow: none;
    }

    &::placeholder {
      color: #999;
    }
  }

  &.has-error ::v-deep input {
    border-color: #ff4444;
  }
}

.error-msg {
  color: #ff4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.poa-button-container {
  margin-top: 2rem;
}

.poa-connect-btn ::v-deep .button,
.poa-generate-btn {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: opacity 0.2s;
  width: 100%;

  &:hover:not(:disabled) {
    background: #333;
    color: #fff;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-success,
.modal-failure {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

.modal-success .modal-title {
  color: #000;

  .success-text {
    color: #4caf50;
  }
}

.modal-failure .modal-title {
  color: #000;

  .failure-text {
    color: #ff4444;
  }
}

.modal-details {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9rem;

  &:not(:last-child) {
    border-bottom: 1px solid #e0e0e0;
  }

  .label {
    color: #666;
  }

  .value {
    color: #333;
    font-family: monospace;
  }
}

.modal-buttons {
  display: flex;
  gap: 1rem;

  button {
    flex: 1;
    padding: 0.75rem;
    border-radius: 6px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;

    &.primary {
      background: #000;
      color: #fff;

      &:hover {
        background: #333;
      }
    }

    &.secondary {
      background: #f0f0f0;
      color: #333;

      &:hover {
        background: #e0e0e0;
      }
    }
  }
}
</style>
