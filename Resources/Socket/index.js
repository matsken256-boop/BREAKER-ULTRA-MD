const pino = require('pino')
const { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const MEGAN_APIKEY = "megan-f4c189d34f1e89b3a2"
const MEGAN_BASE = "https://megan-api.vercel.app"

global.MEGAN_KEY = MEGAN_APIKEY
global.MEGAN_BASE = MEGAN_BASE
global.MEGAN_API = MEGAN_BASE

global.MEGAN_AI = async (prompt) => {
  try {
    const res = await axios.get(`${MEGAN_BASE}/api/ai`, {
      params: { prompt: prompt, key: MEGAN_APIKEY }
    })
    return res.data?.result || res.data?.response || res.data?.answer || "No response"
  } catch (e) {
    const fallback = await axios.get(`https://api.zenith.org/api/ai?text=${encodeURIComponent(prompt)}`)
    return fallback.data?.result || fallback.data?.response || "AI Error"
  }
}

global.MEGAN_IMG = async (prompt) => {
  try {
    const res = await axios.get(`${MEGAN_BASE}/api/image`, {
      params: { prompt: prompt, key: MEGAN_APIKEY
