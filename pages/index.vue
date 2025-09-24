<template>
  <div>
    <b-notification
      :active="isActiveNotification.third"
      class="main-notification"
      type="is-warning"
      icon-pack="icon"
      has-icon
      :aria-close-label="$t('closeNotification')"
      @close="disableNotification({ key: 'third' })"
    >
      <i18n path="trustBanner.trustLess">
        <template v-slot:link>
          <a href="https://tornado.cash/">{{ $t('trustBanner.link') }}</a>
        </template>
      </i18n>
    </b-notification>

    <b-notification
      :active="isActiveNotification.first"
      class="main-notification"
      type="is-info"
      icon-pack="icon"
      has-icon
      :aria-close-label="$t('closeNotification')"
      @close="disableNotification({ key: 'first' })"
    >
    </b-notification>

    <div class="columns is-centered">
      <div class="column is-half-desktop is-three-quarters-tablet is-full-mobile">
        <div class="tabs-wrapper">
          <div class="tabs-header">
            <span class="tab-title">Proof of Association</span>
            <div class="tab-links">
              <span @click="activeTab = 0" :class="['tab-link', { active: activeTab === 0 }]">POA</span>
              <span @click="goToRegistry" class="tab-link">Registry</span>
              <span @click="goToDepositList" class="tab-link">Deposit List</span>
            </div>
          </div>
          <b-tabs v-model="activeTab" class="custom-tabs" :animated="false" @input="tabChanged">
            <ProveInnocence />
            <Withdraw :active-tab="activeTab" @get-key="onGetKey" style="display: none;" />
          </b-tabs>
        </div>
      </div>
    </div>
    <Txs />
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapState, mapGetters, mapActions } from 'vuex'

import Txs from '@/components/Txs'
import Withdraw from '@/components/withdraw/Withdraw'
import ProveInnocence from '@/components/ProveInnocence'

export default {
  name: 'HomePage',
  components: {
    Txs,
    Withdraw,
    ProveInnocence
  },
  data() {
    return {
      activeTab: 0,
      isActive: false
    }
  },
  computed: {
    ...mapState('application', ['selectedInstance']),
    ...mapState('settings', ['isActiveNotification']),
    ...mapGetters('metamask', ['netId'])
  },
  watch: {
    netId() {
      if (this.activeTab === 1) {
        // this.$store.dispatch('relayer/pickRandomRelayer', { type: 'tornado' })
      }
    }
  },
  created() {
    this.$store.dispatch('application/setNativeCurrency', { netId: this.netId })
    this.checkIsTrustedUrl()
  },
  methods: {
    ...mapActions('settings', ['disableNotification']),
    checkIsTrustedUrl() {
      const isIpfs = this.$isLoadedFromIPFS()
      if (!isIpfs) {
        this.disableNotification({ key: 'third' })
      }
    },
    onGetKey(fn) {
      this.getKeys = fn
    },
    async tabChanged(tabIndex) {
      if (tabIndex === 1) {
        // this.$store.dispatch('relayer/pickRandomRelayer', { type: 'tornado' })

        if (typeof this.getKeys === 'function' && !this.isActive) {
          this.isActive = true
          const result = await this.getKeys()

          if (!result) {
            this.isActive = false
          }
        }
      } else {
        const userSelection = this.selectedInstance
        const stateSelection = this.selectedStatistic

        if (
          !stateSelection ||
          userSelection.amount !== stateSelection.amount ||
          userSelection.currency !== stateSelection.currency
        ) {
          this.$store.dispatch('application/setAndUpdateStatistic', {
            currency: userSelection.currency,
            amount: userSelection.amount
          })
        }
      }
    },
    goToRegistry() {
      this.$router.push('/proof-of-innocence')
    },
    goToDepositList() {
      // Navigate to deposit list page or tab
      this.$router.push('/proof-of-innocence')
    }
  }
}
</script>
<style scoped>
.tabs-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.tab-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #000;
}

.tab-links {
  display: flex;
  gap: 2rem;
}

.tab-link {
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-link.active {
  color: #000;
  font-weight: 500;
  border-bottom-color: #000;
}

.tab-link:hover:not(.active) {
  color: #333;
}

.custom-tabs ::v-deep .tabs {
  display: none;
}

.custom-tabs ::v-deep .tab-content {
  padding: 0;
}
</style>
