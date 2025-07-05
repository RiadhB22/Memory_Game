body {
  font-family: Arial, sans-serif;
  background: #f2f2f2;
  text-align: center;
  margin: 0;
  padding: 0;
}

header {
  background-color: #4CAF50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

#players {
  flex: 1;
  display: flex;
  justify-content: space-around;
  font-size: 1rem;
}

#reset-button {
  background: white;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 0.3rem;
}

.active-player::after {
  content: ' ✋';
  font-size: 1.5rem;
}

#game {
  display: grid;
  grid-template-columns: repeat(8, 70px);
  gap: 10px;
  justify-content: center;
  margin: 2rem;
}

.card {
  width: 70px;
  height: 70px;
  perspective: 600px;
}

.inner {
  width: 100%;
  height: 100%;
  transition: transform 0.5s;
  transform-style: preserve-3d;
  position: relative;
}

.inner.flipped {
  transform: rotateY(180deg);
}

.front, .back {
  width: 100%;
  height: 100%;
  position: absolute;
  backface-visibility: hidden;
}

.back {
  background: #ccc;
}

.front {
  transform: rotateY(180deg);
}
