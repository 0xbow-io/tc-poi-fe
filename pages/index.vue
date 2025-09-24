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
      <div class="column">
        <div class="tabs-wrapper">
          <div class="tabs-header">
            <span class="tab-title">Proof of Association</span>
            <div class="tab-links">
              <span :class="['tab-link', { active: activeTab === 0 }]" @click="activeTab = 0">POA</span>
              <span class="tab-link" @click="goToRegistry">Registry</span>
              <span class="tab-link" @click="goToDepositList">Deposit List</span>
            </div>
          </div>
          <b-tabs v-model="activeTab" class="custom-tabs" :animated="false" @input="tabChanged">
            <ProveInnocence />
            <Withdraw :active-tab="activeTab" style="display: none;" @get-key="onGetKey" />
          </b-tabs>
        </div>
      </div>
    </div>
    <!-- FAQ Section -->
    <section class="faq-section">
      <div v-for="(item, idx) in faqItems" :key="idx" class="faq-item">
        <button class="faq-toggle" @click="item.open = !item.open">{{ item.open ? '−' : '+' }}</button>
        <div class="faq-question">{{ item.q }}</div>
        <div v-show="item.open" class="faq-answer">{{ item.a }}</div>
      </div>
    </section>

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
      isActive: false,
      faqItems: [
        {
          q: 'How does Privacy Pools differ from other privacy solutions?',
          a:
            'Privacy Pools is a semi-permissionless application built on public Ethereum with an opinionated approach to compliance and enforcement. It leverages several compliance tools and algorithms provided by 0xbow.io that enable the exclusion of illicit actors.',
          open: true
        },
        {
          q: 'How does Privacy Pools ensure privacy while maintaining compliance?',
          a: 'It uses association sets and membership proofs to keep privacy while enforcing policy.',
          open: false
        },
        {
          q: 'What role does the Association Set Provider (ASP) play?',
          a: 'The ASP curates and publishes association sets that users can target when generating proofs.',
          open: false
        },
        {
          q: 'Can a deposit be blocked from relayed withdrawals after being accepted?',
          a: 'Relayers enforce policy at withdraw time; deposits that fail policy cannot be relayed.',
          open: false
        },
        {
          q: "What happens if a user's deposit is not approved by the ASP?",
          a: 'The proof will fail validation; the user can review requirements and try again later.',
          open: false
        },
        {
          q: 'What happens if someone tries to re-enter the Privacy set?',
          a: 'Nullifier checks prevent double-spending and re-entry exploits.',
          open: false
        },
        {
          q: 'What do I do with my "History File"?',
          a: 'Keep it safe; it contains the local context needed to reconstruct proofs or audits.',
          open: false
        }
      ]
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
      this.$router.push('/registry')
    },
    goToDepositList() {
      // Navigate to Deposit List page
      this.$router.push('/deposit-list')
    }
  },
  head() {
    return {
      title: '0xbow - Proof of Innocence',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/fav.svg?v=3' }]
    }
  }
}
</script>
<style scoped>
.tabs-wrapper {
  background: #fff;
  border: 1px solid #000;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  max-width: 960px;
  margin: 0 auto;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  /* Avoid heavy divider above the form, design uses top bar border instead */
  border-bottom: none;
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

/* Hide the empty info notification bar entirely */
.main-notification.is-info {
  display: none !important;
}

/* FAQ styles below the POA card */
.faq-section {
  max-width: 960px;
  margin: 1.5rem auto 0;
}

.faq-item {
  position: relative;
  border: 1px solid #000;
  border-radius: 0;
  background: #fff;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  margin-bottom: 0.75rem;
}

.faq-toggle {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid #000;
  background: #fff;
  border-radius: 0;
  line-height: 1.2rem;
  font-weight: 700;
}

.faq-question {
  font-weight: 600;
}

.faq-answer {
  color: #666;
  margin-top: 0.5rem;
}
</style>
