<template>
  <section class="section proof-registry">
    <div class="proof-table-wrapper">
      <div class="registry-header">
        <div class="tabs-container">
          <div class="tab active">POA</div>
          <div class="tab">Registry</div>
          <div class="tab">Deposit List</div>
        </div>
        <div class="search-container">
          <b-input v-model="searchNullifier" placeholder="Search" class="search-input" expanded>
            <template #prefix>
              <b-icon icon="magnify" size="is-small" />
            </template>
          </b-input>
        </div>
      </div>

      <div class="registry-table">
        <table>
          <thead>
            <tr>
              <th>ADDRESS</th>
              <th>DATE-TIME</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="proof in paginatedProofs" :key="proof.nullifierHash">
              <td class="address-cell">{{ truncateAddress(proof.sender) }}</td>
              <td class="datetime-cell">{{ formatDateTime(proof.timestamp) }}</td>
              <td class="status-cell">
                <span class="status-approved">Approved</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination-container">
        <span class="pagination-info">{{ currentPage }} OF {{ pageCount }}</span>
        <div class="pagination-controls">
          <button class="pagination-btn" :disabled="currentPage === 1" @click="previousPage">
            &lt;
          </button>
          <span class="page-numbers">
            <span
              v-for="page in displayedPages"
              :key="page"
              :class="['page-number', { active: page === currentPage }]"
              @click="goToPage(page)"
            >
              {{ page }}
            </span>
            <span v-if="showEllipsis" class="ellipsis">
              ...
            </span>
            <span
              :class="['page-number', { active: pageCount === currentPage }]"
              @click="goToPage(pageCount)"
            >
              {{ pageCount }}
            </span>
          </span>
          <button class="pagination-btn" :disabled="currentPage === pageCount" @click="nextPage">
            &gt;
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ethers } from 'ethers'

export default {
  data() {
    return {
      loading: true,
      proofs: [],
      filteredProofs: [],
      currentPage: 1,
      perPage: 50,
      searchNullifier: '',
      useMockData: true
    }
  },
  computed: {
    paginatedProofs() {
      const start = (this.currentPage - 1) * this.perPage
      return this.filteredProofs.slice(start, start + this.perPage)
    },
    pageCount() {
      return Math.ceil(this.filteredProofs.length / this.perPage) || 1
    },
    displayedPages() {
      const pages = []
      const maxPages = 3
      let start = Math.max(1, this.currentPage - 1)
      const end = Math.min(start + maxPages - 1, this.pageCount - 1)

      if (end - start < maxPages - 1) {
        start = Math.max(1, end - maxPages + 1)
      }

      for (let i = start; i <= end && i < this.pageCount; i++) {
        pages.push(i)
      }
      return pages
    },
    showEllipsis() {
      return this.pageCount > 5 && this.currentPage < this.pageCount - 2
    }
  },
  watch: {
    searchNullifier() {
      this.filterProofs()
    }
  },
  async mounted() {
    try {
      this.proofs = this.useMockData ? this.generateMockProofs() : await this.fetchProofsFromBlockchain()

      this.filteredProofs = this.proofs
    } catch (error) {
      console.error('Failed to load proofs:', error)
    } finally {
      this.loading = false
    }
  },
  methods: {
    truncateAddress(addr) {
      return addr.slice(0, 6) + '...' + addr.slice(-4)
    },
    truncateHash(hash) {
      return hash.slice(0, 6) + '...' + hash.slice(-4)
    },
    truncateRoot(hash) {
      return hash.slice(0, 4) + '...' + hash.slice(-4)
    },
    formatDateTime(timestamp) {
      if (!timestamp) return '11.23.24 - 23:45'
      const date = new Date(timestamp)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const year = String(date.getFullYear()).slice(-2)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${month}.${day}.${year} - ${hours}:${minutes}`
    },
    previousPage() {
      if (this.currentPage > 1) this.currentPage--
    },
    nextPage() {
      if (this.currentPage < this.pageCount) this.currentPage++
    },
    goToPage(page) {
      this.currentPage = page
    },
    copyToClipboard(text) {
      navigator.clipboard.writeText(text)
      this.$buefy.toast.open({
        message: `Copied to clipboard: ${text}`,
        type: 'is-success'
      })
    },
    getPoolLabel(address) {
      const POOLS = {
        '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc': '0.1 ETH',
        '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936': '1 ETH',
        '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF': '10 ETH',
        '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291': '100 ETH'
      }
      return POOLS[address] || 'Unknown Pool'
    },
    filterProofs() {
      const query = this.searchNullifier.toLowerCase().trim()
      this.filteredProofs = this.proofs.filter((p) => p.nullifierHash.toLowerCase().includes(query))
      this.currentPage = 1
    },
    generateMockProofs() {
      const randHex = () =>
        '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      const proofs = []

      for (let i = 0; i < 100; i++) {
        const isMembership = i < 50
        const timestamp = Date.now() - i * 1000 * 60 // 1-minute interval spacing

        proofs.push({
          type: isMembership ? 'Membership' : 'Withdrawn',
          sender: randHex().slice(0, 42),
          pool: randHex().slice(0, 42),
          nullifierHash: randHex(),
          value: isMembership ? (Math.random() * 0.01).toFixed(6) : randHex(),
          txHash: randHex(),
          treeLink: `https://0xbow.io/poi/tree/${randHex()}`,
          timestamp
        })
      }

      return proofs.sort((a, b) => b.timestamp - a.timestamp)
    },
    async fetchProofsFromBlockchain() {
      const PROOF_REGISTRY_ADDRESS = process.env.PROOF_REGISTRY_ADDRESS
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
      // const provider = new ethers.providers.JsonRpcProvider(
      //   'https://virtual.mainnet.rpc.tenderly.co/4584cfa3-1295-4846-a580-617ea6dfea7a'
      // )

      const ABI = [
        'event MembershipProofSubmitted(address indexed sender, address indexed pool, bytes32 indexed nullifierHash, uint256 fee)',
        'event WithdrawnAndProved(address indexed sender, address indexed pool, bytes32 indexed nullifierHash, uint256 membershipRoot)'
      ]

      const contract = new ethers.Contract(PROOF_REGISTRY_ADDRESS, ABI, provider)

      const membershipLogs = await contract.queryFilter(
        contract.filters.MembershipProofSubmitted(),
        0,
        'latest'
      )

      const withdrawnLogs = await contract.queryFilter(contract.filters.WithdrawnAndProved(), 0, 'latest')

      return [
        ...membershipLogs.map((log) => ({
          type: 'Membership',
          sender: log.args.sender,
          pool: log.args.pool,
          nullifierHash: log.args.nullifierHash,
          value: ethers.utils.formatEther(log.args.fee),
          txHash: log.transactionHash,
          treeLink: `https://0xbow.io/poi/tree/${log.args.membershipRoot?.toString() || 'unknown'}`
        })),
        ...withdrawnLogs.map((log) => ({
          type: 'Withdrawn',
          sender: log.args.sender,
          pool: log.args.pool,
          nullifierHash: log.args.nullifierHash,
          value: log.args.membershipRoot.toString(),
          txHash: log.transactionHash,
          treeLink: `https://0xbow.io/poi/tree/${log.args.membershipRoot.toString()}`
        }))
      ]
    }
  }
}
</script>

<style scoped>
.proof-registry {
  background: #fff;
  min-height: 100vh;
}

.proof-table-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.registry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.tabs-container {
  display: flex;
  gap: 2rem;
}

.tab {
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab.active {
  color: #000;
  font-weight: 500;
  border-bottom-color: #000;
}

.tab:hover:not(.active) {
  color: #333;
}

.search-container {
  width: 300px;
}

.search-input ::v-deep input {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.registry-table {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.registry-table table {
  width: 100%;
  border-collapse: collapse;
}

.registry-table th {
  text-align: left;
  padding: 1rem;
  background: #fafafa;
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
  border-bottom: 1px solid #e0e0e0;
}

.registry-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
}

.address-cell {
  font-family: monospace;
  color: #333;
}

.datetime-cell {
  color: #666;
}

.status-cell {
  text-align: right !important;
}

.status-approved {
  background: #e8f5e9;
  color: #4caf50;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem 0;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.pagination-btn:hover:not(:disabled) {
  color: #000;
}

.pagination-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  color: #666;
  font-size: 0.9rem;
}

.page-number:hover {
  color: #000;
}

.page-number.active {
  color: #000;
  font-weight: 600;
}

.ellipsis {
  color: #666;
  padding: 0 0.25rem;
}
</style>
