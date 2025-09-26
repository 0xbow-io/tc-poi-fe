<template>
  <div>
    <div class="columns is-centered">
      <div class="column">
        <div class="tabs-wrapper">
          <div class="tabs-header">
            <span class="tab-title">Deposit List</span>
            <div class="tab-links">
              <span class="tab-link" @click="$router.push('/')">POA</span>
              <span class="tab-link" @click="$router.push('/registry')">Registry</span>
              <span class="tab-link active">Deposit List</span>
              <div class="search-container">
                <b-input v-model="searchNullifier" placeholder="Search" class="search-input" expanded>
                  <template #prefix>
                    <b-icon icon="magnify" size="is-small" />
                  </template>
                </b-input>
              </div>
            </div>
          </div>
          <div class="poa-container">
            <div class="registry-table">
              <table>
                <thead>
                  <tr>
                    <th>ADDRESS</th>
                    <th>DATE-TIME</th>
                    <th>STATUS</th>
                    <th>REASON</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="proof in paginatedProofs" :key="proof.nullifierHash">
                    <td class="address-cell">{{ truncateAddress(proof.sender) }}</td>
                    <td class="datetime-cell">{{ formatDateTime(proof.timestamp) }}</td>
                    <td class="status-cell">
                      <span class="status-approved">Approved</span>
                    </td>
                    <td class="reason-cell">
                      Lorem ipsum lorem upsfkim sdfsdf...
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
                  <span v-if="showEllipsis" class="ellipsis"> ... </span>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
  mounted() {
    try {
      this.proofs = this.generateMockProofs()
      this.filteredProofs = this.proofs
    } catch (e) {
      // leave silently for now; UI is mock-only
    } finally {
      this.loading = false
    }
  },
  methods: {
    truncateAddress(addr) {
      if (!addr) return ''
      return addr.slice(0, 6) + '...' + addr.slice(-4)
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
        const timestamp = Date.now() - i * 1000 * 60
        proofs.push({
          sender: randHex().slice(0, 42),
          nullifierHash: randHex(),
          timestamp
        })
      }
      return proofs.sort((a, b) => b.timestamp - a.timestamp)
    }
  },
  head() {
    return {
      title: '0xbow - Deposit List'
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
  border-bottom: none;
}

.tab-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #000;
}

.tab-links {
  display: flex;
  align-items: center;
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

.search-container {
  width: 200px;
  margin-left: 2rem;
}

.search-input ::v-deep input {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

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

.registry-table {
  background: #fff;
  border-radius: 0;
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

.reason-cell {
  color: #666;
  font-family: monospace;
}

.status-approved {
  padding: 4px 12px;
  gap: 10px;
  width: 72px;
  height: 24px;
  background: #dfecc6;
  border: 1px solid #7d9c40;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
