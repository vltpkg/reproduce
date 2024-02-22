(async function () {
  const reproduce = require('./index.js')
  console.log(await reproduce('migrate'))
})()
