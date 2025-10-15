import { trees } from '@/constants'
import { download } from '@/store/snark'
import { CONTRACT_INSTANCES } from '@/constants'

class InnocenceService {
  constructor({ netId, amount, currency, commitment, instanceName }) {
    this.netId = netId
    this.amount = amount
    this.currency = currency
    this.commitment = commitment
    this.instanceName = instanceName

    this.idb = window.$nuxt.$indexedDB(netId)
  }

  getFileName(partNumber = trees.PARTS_COUNT) {
    return `trees/deposits_${this.currency}_${this.amount}_slice${partNumber}.json.gz`
  }

  async downloadSlice(name) {
    const slicedData = await download({
      name,
      eventName: 'trees',
      contentType: 'string'
    })

    if (!slicedData) {
      throw new Error('Cant download file')
    }

    return JSON.parse(slicedData)
  }

  async getInnocentCommitments() {
    console.info('innocenceService.js:getInnocentCommitments')

    try {
      // First, check if we have cached commitments in DB
      const cachedCommitments = await this.getInnocentCommitmentsFromDB()

      if (cachedCommitments && cachedCommitments.length > 0) {
        console.log('Using cached innocent commitments', cachedCommitments.length)
        return cachedCommitments
      }

      // If no cache, fetch from tree files for all amounts
      console.log('Fetching innocent commitments from tree files for all amounts')
      const allCommitments = []

      // Loop through all contract instances (amounts)
      for (const amount of CONTRACT_INSTANCES) {
        console.log(`Fetching commitments for ${this.currency} ${amount}`)

        // Download all tree slices for this amount
        for (let i = 1; i <= trees.PARTS_COUNT; i++) {
          try {
            const fileName = `trees/deposits_${this.currency}_${amount}_slice${i}.json.gz`
            const sliceData = await this.downloadSlice(fileName)

            // Extract commitments from elements array
            if (sliceData.elements && Array.isArray(sliceData.elements)) {
              allCommitments.push(...sliceData.elements)
            }
          } catch (err) {
            console.error(`Failed to download slice ${i} for ${this.currency} ${amount}:`, err)
          }
        }
      }

      console.log('Fetched innocent commitments count:', allCommitments.length)

      // Save to cache for future use
      if (allCommitments.length > 0) {
        await this.saveInnocentCommitments({ commitments: allCommitments })
      }

      return allCommitments.map((commitment) => ({ commitment }))
    } catch (err) {
      console.error('failed getting innocent commitment cache', err)
      return []
    }
  }

  async saveInnocentCommitments({ commitments }) {
    await Promise.resolve()
    try {
      this.idb.putItem({
        storeName: `stringify_inno_${this.currency}_commitments`,
        data: { commitments: JSON.stringify(commitments) },
        key: 'commitments'
      })
      console.log('Saved innocent commitments to cache')
    } catch (err) {
      console.error('saveInnocentCommitment has error:', err.message)
    }
  }

  async getInnocentCommitmentsFromDB() {
    try {
      const result = await this.idb.getAll({
        storeName: `stringify_inno_${this.currency}_commitments`
      })

      if (!result || result.length === 0) {
        return null
      }

      const [{ commitments }] = result
      const parsedCommitments = JSON.parse(commitments)

      return parsedCommitments.map((commitment) => ({ commitment }))
    } catch (err) {
      console.error('Error getting innocent commitments from DB:', err)
      return null
    }
  }
}

export const innocenceService = InnocenceService
