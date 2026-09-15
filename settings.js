const express = require('express');

const fs = require('fs');

const { useMultiFileAuthState } = require('@whiskeysockets/baileys');

const app = express();

let getSockFunc = null;

function setSock(fn) { getSockFunc = fn; }

function getSock() { return getSockFunc ? getSockFunc() : null; }

app.get('/', (req, res) => {

  if (req.query.password !== 'breaker123') return res.send('Wrong password');

  res.sendFile(__dirname + '/pair.html');

});

app.get('/pair', async (req, res) => {

  try {

    if (req.query.password !== 'breaker123
