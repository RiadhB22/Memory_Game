body {
  font-family: Arial, sans-serif;
  margin: 0;
  background: #f2f2f2;
  text-align: center;
}

h1 {
  background: #4caf50;
  color: white;
  padding: 12px;
  margin: 0;
}

#status-bar {
  background: #e0f7fa;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  font-weight: bold;
}

.active-player {
  color: #d32f2f;
  font-size: 1.2em;
}

#waiting-message {
  margin: 10px;
  color: #d32f2f;
  font-size: 18px;
}

#game {
  display: grid;
  grid-template-columns: repeat(5, 100px);
  gap: 10px;
  justify-content: center;
  margin: 20px auto;
}

.card {
  width: 100px;
  height: 100px;
  perspective: 800px;
}

.inner {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  position: relative;
}

.flipped {
  transform: rotateY(180deg);
}

.front, .back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.back {
  transform: rotateY(180deg);
}

.front img, .back img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

button {
  background: #0288d1;
  color: white;
  padding: 10px 20px;
  margin: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:disabled {
  background: #aaa;
}
