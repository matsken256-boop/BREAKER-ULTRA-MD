module.exports = {
  formatDate: () => new Date().toLocaleString(),
  isOwner: (jid, ownerNumber) => {
    return jid.includes(ownerNumber);
  },
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};
