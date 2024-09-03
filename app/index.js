const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(bodyParser.json());

const games = {};  // Store game data by chat_id or user_id

// Telegram Bot Token
const TELEGRAM_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Start new game command
app.post('/start', async (req, res) => {
    const chat_id = req.body.message.chat.id;
    games[chat_id] = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        active: true
    };

    await sendMessage(chat_id, 'New Tic-Tac-Toe game started! Player X\'s turn.');
    res.send();
});

// Handle player moves
app.post('/move', async (req, res) => {
    const chat_id = req.body.message.chat.id;
    const text = req.body.message.text;
    const game = games[chat_id];

    if (!game || !game.active) {
        await sendMessage(chat_id, 'No active game. Use /start to begin a new game.');
        return res.send();
    }

    const move = parseInt(text);
    if (isNaN(move) || move < 1 || move > 9 || game.board[move - 1] !== '') {
        await sendMessage(chat_id, 'Invalid move. Choose an empty spot (1-9).');
        return res.send();
    }

    game.board[move - 1] = game.currentPlayer;
    const winner = checkWinner(game.board);

    if (winner) {
        await sendMessage(chat_id, `Player ${game.currentPlayer} wins!`);
        game.active = false;
    } else if (!game.board.includes('')) {
        await sendMessage(chat_id, 'Game ended in a draw!');
        game.active = false;
    } else {
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
        await sendMessage(chat_id, `Player ${game.currentPlayer}'s turn.`);
    }
    res.send();
});

function checkWinner(board) {
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return board[a];
        }
    }
    return null;
}

async function sendMessage(chat_id, text) {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id,
        text
    });
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
