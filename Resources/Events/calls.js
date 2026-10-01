const config = require('../../settings');

module.exports = async (conn, call) => {
  try {
    for (let c of call) {
      if (c.status === 'offer') {
        
        console.log(`📵 Call rejected from: ${c.from}`);

        await conn.rejectCall(c.id, c.from);

        const callerId = c.from;
        await conn.sendMessage(callerId, {
          text: `📵 *Calls Not Allowed!*

❌ Do NOT call
✅ Text only

> BREAKER ULTRA MD`
        });

        // 🚫 BLOCK OPTION
        await conn.updateBlockStatus(callerId, "block");
        console.log(`🚫 Blocked caller: ${c.from}`);
      }
    }
  } catch (e) {
    console.log('Error in calls.js:', e);
  }
};