<template>
  <footer class="footer">
    <div class="container">
      <div class="level">
        <div class="level-left"></div>
        <div class="level-right">
          <div class="level-item is-column">
            <div class="level-subitem">
              <div class="buttons">
                <b-button
                  tag="a"
                  type="is-light"
                  href="https://docs.google.com/forms/d/e/1FAIpQLSe49h25mMtzRYN9HKg5S6B_70UdC2FWPtYAO_w0sPfLtN5IRg/viewform?usp=header"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="r-button"
                  >report illicit deposit</b-button
                >
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://x.com/0xprivacypools"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="x-button"
                  >𝕏</b-button
                >
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://github.com/0xbow-io/tc-poi-fe"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="github"
                ></b-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  components: {},
  data() {
    return {}
  },
  computed: {},
  methods: {}
}
</script>

<style>
.x-button.button {
  color: #000 !important;
  font-size: 1.25rem !important;
}
.r-button.button {
  color: #777 !important;
  font-weight: normal !important;
  font-size: 0.9rem !important;
}
</style>
