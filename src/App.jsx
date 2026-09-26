import { useState, useEffect, useRef } from "react"

const allCards = [
  "🍎", "🍌", "🍇", "🍉", "🥝",
  "🍒", "🍊", "🍋", "🥭", "🍍",
]

const difficulties = {
  Easy: {
    pairs: 4,
    columns: 4,
  },
  Medium: {
    pairs: 6,
    columns: 4,
  },
  Hard: {
    pairs: 8,
    columns: 4,
  },
  Expert: {
    pairs: 10,
    columns: 5,
  },
}

// Create a properly shuffled deck
function createCards(pairs) {
  const selectedCards = allCards.slice(0, pairs)

  const deck = [...selectedCards, ...selectedCards]

  for (let i = deck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1))

    ;[deck[i], deck[randomIndex]] = [
      deck[randomIndex],
      deck[i],
    ]
  }

  return deck
}

function App() {
  const [difficulty, setDifficulty] = useState("Easy")

  const [cards, setCards] = useState(
    createCards(difficulties.Easy.pairs)
  )

  const [flippedCards, setFlippedCards] = useState([])
  const [matchedCards, setMatchedCards] = useState([])

  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)

  const [gameStarted, setGameStarted] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  const [showInstructions, setShowInstructions] = useState(true)
  const [newBest, setNewBest] = useState(false)

  const timeoutRef = useRef(null)
  const restartTimeoutRef = useRef(null)

  // Load saved best scores
  const [bestScores, setBestScores] = useState(() => {
    const savedScores = localStorage.getItem(
      "memoryMatchBestScores"
    )

    return savedScores
      ? JSON.parse(savedScores)
      : {
          Easy: null,
          Medium: null,
          Hard: null,
          Expert: null,
        }
  })

  // Timer
  useEffect(() => {
    if (!gameStarted) return

    const timer = setInterval(() => {
      setTime((previousTime) => previousTime + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted])

  // Save best scores
  useEffect(() => {
    localStorage.setItem(
      "memoryMatchBestScores",
      JSON.stringify(bestScores)
    )
  }, [bestScores])

  // Clear timers when component is removed
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
    }
  }, [])

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`
  }

  // Start a new game
  function startGame(level) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    setDifficulty(level)
    setCards(createCards(difficulties[level].pairs))

    setFlippedCards([])
    setMatchedCards([])

    setMoves(0)
    setTime(0)

    setGameStarted(false)
    setIsRestarting(false)

    setNewBest(false)
    setShowInstructions(false)
  }

  // Restart current game
  function restartGame() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
    }

    setIsRestarting(true)

    setFlippedCards([])
    setMatchedCards([])

    setMoves(0)
    setTime(0)

    setGameStarted(false)
    setNewBest(false)

    restartTimeoutRef.current = setTimeout(() => {
      setCards(
        createCards(difficulties[difficulty].pairs)
      )

      setIsRestarting(false)
      restartTimeoutRef.current = null
    }, 300)
  }

  // Handle card click
  function handleCardClick(index) {
    if (
      isRestarting ||
      flippedCards.includes(index) ||
      matchedCards.includes(index) ||
      flippedCards.length === 2
    ) {
      return
    }

    if (!gameStarted) {
      setGameStarted(true)
    }

    const newFlippedCards = [
      ...flippedCards,
      index,
    ]

    setFlippedCards(newFlippedCards)

    // Two cards selected
    if (newFlippedCards.length === 2) {
      setMoves((previousMoves) => previousMoves + 1)

      const firstCard = newFlippedCards[0]
      const secondCard = newFlippedCards[1]

      // Matching pair
      if (cards[firstCard] === cards[secondCard]) {
        setMatchedCards((previousMatched) => [
          ...previousMatched,
          firstCard,
          secondCard,
        ])

        setFlippedCards([])
      } else {
        // Cancel previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Hide wrong cards
        timeoutRef.current = setTimeout(() => {
          setFlippedCards([])
          timeoutRef.current = null
        }, 900)
      }
    }
  }

  const gameWon =
    matchedCards.length === cards.length &&
    cards.length > 0

  // Handle win
  useEffect(() => {
    if (!gameWon) return

    setGameStarted(false)

    setBestScores((previousScores) => {
      const currentBest = previousScores[difficulty]

      const isNewBest =
        currentBest === null ||
        moves < currentBest.moves ||
        (
          moves === currentBest.moves &&
          time < currentBest.time
        )

      if (isNewBest) {
        setNewBest(true)

        return {
          ...previousScores,
          [difficulty]: {
            moves,
            time,
          },
        }
      }

      setNewBest(false)

      return previousScores
    })
  }, [
    gameWon,
    difficulty,
    moves,
    time,
  ])

  const currentBest = bestScores[difficulty]

  // Responsive grid
  const gridClass =
    difficulty === "Expert"
      ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5"
      : "grid-cols-2 sm:grid-cols-4"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-blue-950 text-white px-4 py-8 sm:py-10">

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 px-4">

          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">

            <div className="text-center mb-6">

              <div className="text-5xl mb-3">
                🃏
              </div>

              <h2 className="text-3xl font-bold">
                Memory Match
              </h2>

              <p className="text-gray-400 mt-2">
                Test your memory and beat your best score!
              </p>

            </div>

            <div className="space-y-4 text-gray-300 mb-7">

              <div className="flex gap-3">
                <span>🧠</span>
                <span>
                  Flip two cards at a time.
                </span>
              </div>

              <div className="flex gap-3">
                <span>🎯</span>
                <span>
                  Find all matching pairs.
                </span>
              </div>

              <div className="flex gap-3">
                <span>🔢</span>
                <span>
                  Complete the game using fewer moves.
                </span>
              </div>

              <div className="flex gap-3">
                <span>⏱️</span>
                <span>
                  The timer starts with your first card.
                </span>
              </div>

              <div className="flex gap-3">
                <span>🏆</span>
                <span>
                  Choose from four difficulty levels.
                </span>
              </div>

            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all py-3 rounded-xl font-semibold shadow-lg"
            >
              ▶ Start Game
            </button>

          </div>

        </div>
      )}

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <header className="text-center mb-8">

          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-300 text-sm font-medium mb-4">
            🎮 Memory Challenge
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            🃏 Memory Match
          </h1>

          <p className="text-gray-400 mt-3">
            Find all matching pairs as quickly as possible.
          </p>

        </header>

        {/* Difficulty */}
        <div className="mb-6">

          <p className="text-center text-sm text-gray-500 mb-3">
            Select Difficulty
          </p>

          <div className="flex flex-wrap justify-center gap-2">

            {Object.keys(difficulties).map((level) => (

              <button
                key={level}
                onClick={() => startGame(level)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  difficulty === level
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {level}
              </button>

            ))}

          </div>

        </div>

        {/* Stats */}
        <div className="bg-gray-800/80 backdrop-blur border border-gray-700/60 rounded-2xl p-4 mb-5 shadow-xl">

          <div className="grid grid-cols-3 divide-x divide-gray-700">

            <div className="text-center">

              <p className="text-gray-500 text-xs sm:text-sm">
                SCORE
              </p>

              <p className="text-2xl font-bold text-blue-400 mt-1">
                {matchedCards.length / 2}
              </p>

            </div>

            <div className="text-center">

              <p className="text-gray-500 text-xs sm:text-sm">
                MOVES
              </p>

              <p className="text-2xl font-bold text-purple-400 mt-1">
                {moves}
              </p>

            </div>

            <div className="text-center">

              <p className="text-gray-500 text-xs sm:text-sm">
                TIME
              </p>

              <p className="text-2xl font-bold text-green-400 mt-1">
                {formatTime(time)}
              </p>

            </div>

          </div>

        </div>

        {/* Best Score */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-6 text-center">

          <p className="text-yellow-400 font-semibold">
            🏆 Best {difficulty} Score
          </p>

          {currentBest ? (

            <p className="text-gray-300 text-sm mt-1">
              {currentBest.moves} moves
              <span className="text-gray-600 mx-2">
                •
              </span>
              {formatTime(currentBest.time)}
            </p>

          ) : (

            <p className="text-gray-500 text-sm mt-1">
              No score yet — be the first!
            </p>

          )}

        </div>

        {/* Restart */}
        <div className="flex justify-center mb-6">

          <button
            onClick={restartGame}
            disabled={isRestarting}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/20 disabled:opacity-60"
          >
            🔄 Restart Game
          </button>

        </div>

        {/* Winning Message */}
        {gameWon && !isRestarting && (

          <div className="text-center mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-5">

            <div className="text-4xl mb-2">
              🎉
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-green-400">
              You Won!
            </h2>

            <p className="text-gray-300 mt-2">
              {difficulty} completed in{" "}
              <span className="font-semibold text-white">
                {moves} moves
              </span>{" "}
              and{" "}
              <span className="font-semibold text-white">
                {formatTime(time)}
              </span>
              .
            </p>

            {newBest && (
              <p className="text-yellow-400 font-semibold mt-3">
                🏆 New Best Score!
              </p>
            )}

          </div>

        )}

        {/* Game Board */}
        <div
          className={`grid ${gridClass} gap-3 sm:gap-4 mx-auto max-w-2xl`}
        >

          {cards.map((card, index) => {

            const isFlipped =
              !isRestarting &&
              (
                flippedCards.includes(index) ||
                matchedCards.includes(index)
              )

            const isMatched =
              matchedCards.includes(index)

            return (

              <div
                key={index}
                onClick={() => handleCardClick(index)}
                className="h-24 sm:h-28 md:h-32 cursor-pointer"
                style={{
                  perspective: "1000px",
                }}
              >

                <div
                  className={`relative w-full h-full transition-transform duration-500 ${
                    !isFlipped && !isRestarting
                      ? "hover:scale-[1.04]"
                      : ""
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped
                      ? "rotateY(180deg)"
                      : "rotateY(0deg)",
                  }}
                >

                  {/* Front */}
                  <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl sm:text-4xl shadow-lg border border-white/10"
                    style={{
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <span className="opacity-90">
                      ?
                    </span>
                  </div>

                  {/* Back */}
                  <div
                    className={`absolute inset-0 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg border border-white/10 ${
                      isMatched
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse"
                        : "bg-gradient-to-br from-purple-500 to-pink-600"
                    }`}
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {card}
                  </div>

                </div>

              </div>

            )
          })}

        </div>

        {/* Footer */}
        <div className="text-center mt-8">

          <p className="text-gray-600 text-xs sm:text-sm">
            Match all pairs to complete the challenge 🧠
          </p>

        </div>

      </div>

    </div>
  )
}

export default App