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
          </b-tabs>
        </div>
      </div>
    </div>
    <!-- FAQ Section -->
    <section class="faq-section">
      <div v-for="(item, idx) in faqItems" :key="idx" class="faq-item">
        <button class="faq-toggle" @click="item.open = !item.open">{{ item.open ? '−' : '+' }}</button>
        <div class="faq-question">{{ item.q }}</div>
        <div v-show="item.open" class="faq-answer" v-html="item.a"></div>
      </div>
    </section>

    <Txs />
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapState, mapGetters, mapActions } from 'vuex'

import Txs from '@/components/Txs'
import ProveInnocence from '@/components/ProveInnocence'

export default {
  name: 'HomePage',
  components: {
    Txs,
    ProveInnocence
  },
  data() {
    return {
      activeTab: 0,
      isActive: false,
      faqItems: [
        {
          q: 'Does using the Tornado Cash Proof of Association break my privacy?',
          a:
            'No. All computation is performed locally, nothing is uploaded to 0xbow or stored in any capacity. Your Note does not expose your deposit address in any way.',
          open: true
        },
        {
          q: 'Who should use the Tornado Cash Proof of Association?',
          a:
            'Any address that has been funded by Tornado Cash can use the tool, it allows you to dissociate publicly from any illicit activity.',
          open: false
        },
        {
          q: 'Who is excluded from the Registry?',
          a: `Our methodology for curating the association set is straightforward, deposits associated with the following are excluded:<ul><li>• Criminal or sanctioned organisations</li><li>• Hacks, theft, or scams</li><li>• Re-deposits from Tornado Cash</li><li>• Deposits made during or after the period of Tornado Cash being sanctioned</li></ul>`,
          open: false
        },
        {
          q: 'What if generating the proof didn’t work?',
          a:
            'As we cannot see the computation, it is hard to pinpoint exactly why it failed. However, most likely it is because; 1) your note or withdrawal address are incorrect, or 2) your withdrawal address is not associated with your note or vice versa.',
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
