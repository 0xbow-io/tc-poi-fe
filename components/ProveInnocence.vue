<template>
  <b-tab-item label="POA" header-class="button_tab_poa">
    <div class="poa-container">
      <div class="poa-header">
        <h2 class="poa-title">Generate POA</h2>
      </div>

      <div class="poa-grid">
        <div class="poa-left">
          <div class="field poa-field">
            <b-input
              v-model="withdrawNote"
              placeholder="Enter Note"
              :custom-class="hasErrorNote ? 'has-error' : ''"
              data-test="enter_note_field"
              class="poa-input"
              @blur="noteInputTouched = true"
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
        </div>

        <div class="poa-right">
          <div class="poa-right-title">Tornado Cash Proof of Association</div>
          <p>
            The Proof of Association (PoA) allows Tornado Cash users to separate their activity from illicit
            actors who have also used the protocol.
          </p>
          <p>
            By pasting your note and withdrawal address, the system will generate a proof that checks your
            withdrawal against a curated list of Tornado Cash deposits. This list excludes illicit actors that
            have tainted the Tornado Cash protocol.
          </p>
          <p>
            If your withdrawal is not associated with any of these activities, your address will be accepted
            and added to the onchain Registry. This registry makes it clear, publicly and transparently, that
            your address is not linked to illicit activity; restoring any potential doubts about the origin of
            your funds.
          </p>
        </div>
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
    <!-- Note Details Modal -->
    <b-modal v-model="showNoteDetailsModal" :can-cancel="['escape', 'x', 'outside']">
      <div class="modal-card note-details-modal">
        <header class="modal-card-head">
          <p class="modal-card-title">Note Details</p>
        </header>
        <section class="modal-card-body">
          <div class="note-detail-item">
            <div class="detail-label">{{ $t('amount') }}:</div>
            <div class="detail-value">{{ selectedAmount }} {{ selectedStatisticCurrency }}</div>
          </div>
          <div class="note-detail-item">
            <div class="detail-label">{{ $t('timePassed') }}:</div>
            <div class="detail-value" :class="{ 'warning-text': notEnoughPassedTime }">
              {{ timePassed }}
            </div>
          </div>
          <div class="note-detail-item">
            <div class="detail-label">{{ $t('subsequentDeposits') }}:</div>
            <div class="detail-value" :class="{ 'warning-text': notEnoughDeposits }">
              {{ this.$tc('userDeposit', depositsPast) }}
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <b-button @click="showNoteDetailsModal = false">Close</b-button>
        </footer>
      </div>
    </b-modal>
  </b-tab-item>
</template>

<script>
/* eslint-disable no-console */
import { mapActions, mapGetters, mapState } from 'vuex'
import { getTornadoKeys } from '@/store/snark'

import { DONATIONS_ADDRESS } from '@/constants'

import SettingsModalBox from '@/components/settings/SettingsModalBox'
import { ConnectButton } from '@/components/web3Connect'
import ProveInnocenceModalBox from '@/components/ProveInnocenceModalBox.vue'

const { isHexStrict, isAddress } = require('web3-utils')

export default {
  components: {
    ConnectButton
  },
  data() {
    return {
      withdrawAddress: '',
      withdrawNote: '',
      noteInputTouched: false,
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
      showNoteDetailsModal: false,
      proofDetails: {
        from: '',
        to: '',
        fees: '0.0075 xDAI (~ $0.00)',
        feeCollector: '0xbow (0x1a2b...3c4d)'
      },
      DONATIONS_ADDRESS
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
      if (!this.withdrawNote || !this.noteInputTouched) {
        return false
      }
      const note = this.withdrawNote.split('-')[4]
      if (typeof WebAssembly === 'undefined') {
        return {
          type: 'is-warning',
          msg: this.$t('turnOnWasm')
        }
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
      return this.isLoading || !!this.error.type || this.hasErrorNote
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
          // Only process if we have a reasonable looking note format
          if (!withdrawNote || withdrawNote.length < 10 || !withdrawNote.includes('-')) {
            this.$store.dispatch('loading/disable')
            return
          }

          this.$store.dispatch('loading/enable', { message: this.$t('gettingTheNoteData') })
          this.isSpent = false
          this.depositsPast = null
          this.depositTxHash = null
          this.depositTimestamp = null

          if (!this.hasErrorNote) {
            const [tornadoPrefix, currency, amount, noteNetId, note] = this.withdrawNote.split('-')
            if (tornadoPrefix !== 'tornado' && this.withdrawNote.split('-').length >= 5) {
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
            // Show the note details modal after fetching the data
            if (this.depositTxHash) {
              this.showNoteDetailsModal = true
            }
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
        this.noteInputTouched = false
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
      this.noteInputTouched = false
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

        console.log('\n\nYOUR NOTE DATA:')
        console.log('note:', note)
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

        // Use existing application action; if it resolves, consider it a success
        await this.$store.dispatch('application/prepareInnocenceProof', {
          note: this.withdrawNote
        })

        // Open modal to confirm and submit proof to chain
        this.$buefy.modal.open({
          parent: this,
          component: ProveInnocenceModalBox,
          hasModalCard: true,
          width: 440,
          props: {
            note: this.withdrawNote,
            withdrawType: 'wallet'
          },
          customClass: 'is-pinned'
        })
      } catch (err) {
        this.error = {
          type: this.$t('error'),
          message: err.message
        }
        const fromAddress = this.$store.state.metamask.ethAccount || this.withdrawAddress
        this.proofDetails.from = fromAddress || ''
        this.proofDetails.to = this.withdrawAddress || ''
        this.showFailureModal = true
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
      this.$router.push('/registry')
      this.closeSuccessModal()
    }
  }
}
</script>
<style lang="scss" scoped>
.poa-container {
  padding: 2rem;
  background: #ffffff;
  border-top: 1px solid #000;
  border-bottom: none;
  border-left: none;
  border-right: none;
  border-radius: 0;
  box-shadow: none;
  max-width: none;
  width: 100%;
}

.poa-header {
  margin-bottom: 1rem;
}

.poa-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
}

.poa-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 2rem;
  min-height: 400px;
}

@media (max-width: 768px) {
  .poa-container {
    padding: 1rem;
  }

  .poa-grid {
    display: block;
  }
}

.poa-left {
  border-right: 1px solid #000;
  padding: 1rem;
}

@media (max-width: 768px) {
  .poa-left {
    border: none;
    padding: 0.5rem;
  }

  .poa-field {
    width: 100%;
  }

  /* Target the b-input component wrapper */
  .poa-input {
    width: 100% !important;
  }

  /* Target the actual input control wrapper inside b-input */
  .poa-input ::v-deep .control {
    width: 100% !important;
  }

  /* Target the input element inside b-input */
  .poa-input ::v-deep .control input {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    width: 100% !important;
    box-sizing: border-box;
  }

  .poa-right {
    padding-left: 0.5rem;
  }
}

.poa-right {
  padding-left: 1rem;
}

.poa-right-title {
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.poa-right p {
  margin-bottom: 1rem;
  line-height: 1.5;
  color: #666;
}

.poa-field {
  margin-bottom: 1rem;
}

.poa-input {
  ::v-deep input {
    background: #fff;
    border: 1px solid #000;
    border-radius: 0;
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

  /* highlight when Buefy applies custom-class to inner input */
  ::v-deep input.has-error {
    border-color: #ff4444;
  }
}

.error-msg {
  color: #ff4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.poa-button-container {
  margin-top: 1rem;
}

.poa-connect-btn ::v-deep .button,
.poa-generate-btn {
  background: #fff !important;
  color: #000 !important;
  border: 1px solid #000 !important;
  border-radius: 0 !important;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s;
  width: 100%;
  min-height: 2.5rem;

  &:hover:not(:disabled) {
    background: #f8f8f8 !important;
    color: #000 !important;
    border-color: #000 !important;
  }

  &:disabled {
    background: #f5f5f5 !important;
    color: #999 !important;
    border-color: #ddd !important;
    cursor: not-allowed;
  }

  &:focus {
    box-shadow: none !important;
    border-color: #000 !important;
    background: #fff !important;
    color: #000 !important;
  }

  &:active {
    background: #f0f0f0 !important;
    color: #000 !important;
    border-color: #000 !important;
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
/* Note Details Modal Styles */
.note-details-modal {
  background: white !important;
  border-radius: 8px;
  overflow: hidden;
}

.note-details-modal .modal-card-head {
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  padding: 1.5rem;
}

.note-details-modal .modal-card-title {
  color: #000;
  font-size: 1.25rem;
  font-weight: 600;
}

.note-details-modal .modal-card-body {
  padding: 1rem;
  background: white;
  overflow-x: hidden;
}

.note-detail-item {
  margin-bottom: 1.5em;
}

.note-detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #666;
  font-weight: 500;
  margin-bottom: 0.5em;
}

.detail-value {
  color: #000;
  font-weight: 600;
  font-size: 1.1em;
}

.detail-value.warning-text {
  color: #ff6b00;
}

.note-details-modal .modal-card-foot {
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
}

.note-details-modal .button {
  background: white;
  color: #000;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 0.5rem 1.5rem;
  font-weight: 500;
}

.note-details-modal .button:hover {
  background: #f5f5f5;
}

/* Override Buefy modal width */
::v-deep .modal-card {
  width: auto !important;
  max-width: 800px !important;
}
</style>
