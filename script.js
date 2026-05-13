const yearTarget = document.querySelector("#year");
const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");
const missionTrigger = document.querySelector(".mission-trigger");
const missionStatus = document.querySelector(".mission-status");
const projectGrid = document.querySelector("#project-grid");
const missionCards = document.querySelectorAll(".mission-card");
const arcadeCanvas = document.querySelector("#mini-game");
const arcadeTrigger = document.querySelector(".arcade-trigger");
const arcadeScore = document.querySelector("#arcade-score");
const arcadeTime = document.querySelector("#arcade-time");
const arcadeStatus = document.querySelector("#arcade-status");
const arcadeNote = document.querySelector(".arcade-note");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if (menuToggle && siteHeader) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.15,
  }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 70, 420)}ms`;
  revealObserver.observe(item);
});

const selectMission = (card) => {
  missionCards.forEach((item) => {
    const isActive = item === card;
    item.classList.toggle("is-selected", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });

  if (missionStatus) {
    missionStatus.textContent = `${card.dataset.mission} selected. Mission data synced.`;
  }
};

if (missionTrigger && projectGrid) {
  missionTrigger.addEventListener("click", () => {
    projectGrid.classList.remove("project-grid-locked");
    projectGrid.classList.add("project-grid-live");
    projectGrid.setAttribute("aria-hidden", "false");
    missionTrigger.textContent = "Archive Online";
    missionTrigger.disabled = true;

    if (missionStatus) {
      missionStatus.textContent = "Archive online. Select a mission card to inspect the loadout.";
    }

    const firstCard = missionCards[0];

    if (firstCard) {
      window.setTimeout(() => {
        selectMission(firstCard);
      }, 450);
    }
  });
}

missionCards.forEach((card) => {
  const activateCard = () => {
    if (!projectGrid || projectGrid.classList.contains("project-grid-locked")) {
      return;
    }

    selectMission(card);
  };

  card.addEventListener("click", activateCard);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    activateCard();
  });
});

if (arcadeCanvas && arcadeTrigger && arcadeScore && arcadeTime && arcadeStatus) {
  const ctx = arcadeCanvas.getContext("2d");
  const gameWidth = arcadeCanvas.width;
  const gameHeight = arcadeCanvas.height;
  const keys = {
    left: false,
    right: false,
  };
  const state = {
    running: false,
    score: 0,
    timeLeft: 25,
    lastFrame: 0,
    spawnTimer: 0,
    timeAccumulator: 0,
    flashTimer: 0,
    animationId: 0,
    player: {
      x: gameWidth / 2,
      y: gameHeight - 32,
      width: 26,
      height: 16,
      speed: 260,
    },
    items: [],
    stars: Array.from({ length: 28 }, (_, index) => ({
      x: (index * 47) % gameWidth,
      y: (index * 29) % gameHeight,
      speed: 12 + (index % 5) * 7,
    })),
  };

  const setArcadeMessage = (message) => {
    arcadeStatus.textContent = message;
    if (arcadeNote) {
      arcadeNote.textContent = message;
    }
  };

  const resetGame = () => {
    state.running = false;
    state.score = 0;
    state.timeLeft = 25;
    state.lastFrame = 0;
    state.spawnTimer = 0;
    state.timeAccumulator = 0;
    state.flashTimer = 0;
    state.items = [];
    state.player.x = gameWidth / 2;
    arcadeScore.textContent = "0";
    arcadeTime.textContent = "25";
    setArcadeMessage("Mission briefing loaded. Launch the run to start the game.");
    drawGame();
  };

  const endGame = () => {
    state.running = false;
    window.cancelAnimationFrame(state.animationId);
    arcadeTrigger.textContent = "Restart Run";
    setArcadeMessage(`Mission complete. Final score: ${state.score}`);
    drawGame();
  };

  const spawnItem = () => {
    const isHazard = Math.random() < 0.35;
    state.items.push({
      x: 26 + Math.random() * (gameWidth - 52),
      y: -20,
      radius: isHazard ? 10 : 8,
      speed: isHazard ? 160 + Math.random() * 60 : 120 + Math.random() * 55,
      type: isHazard ? "hazard" : "core",
      drift: (Math.random() - 0.5) * 22,
    });
  };

  const drawBackground = () => {
    const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight);
    gradient.addColorStop(0, "#07111f");
    gradient.addColorStop(1, "#030914");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    ctx.strokeStyle = "rgba(92, 238, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= gameWidth; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gameHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= gameHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gameWidth, y);
      ctx.stroke();
    }

    state.stars.forEach((star) => {
      ctx.fillStyle = "rgba(238, 246, 255, 0.65)";
      ctx.fillRect(star.x, star.y, 2, 2);
    });
  };

  const drawPlayer = () => {
    const { x, y, width, height } = state.player;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#5ceeff";
    ctx.shadowColor = "rgba(92, 238, 255, 0.8)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(0, -height);
    ctx.lineTo(width / 2, height);
    ctx.lineTo(0, height / 3);
    ctx.lineTo(-width / 2, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#81ff87";
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawItems = () => {
    state.items.forEach((item) => {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === "core") {
        ctx.fillStyle = "#5ceeff";
        ctx.shadowColor = "rgba(92, 238, 255, 0.85)";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(0, -item.radius);
        ctx.lineTo(item.radius, 0);
        ctx.lineTo(0, item.radius);
        ctx.lineTo(-item.radius, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = "#ff7f7f";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(255, 127, 127, 0.85)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-item.radius, -item.radius);
        ctx.lineTo(item.radius, item.radius);
        ctx.moveTo(item.radius, -item.radius);
        ctx.lineTo(-item.radius, item.radius);
        ctx.stroke();
      }

      ctx.restore();
    });
  };

  const drawOverlay = () => {
    if (state.running) {
      return;
    }

    ctx.fillStyle = "rgba(2, 8, 18, 0.5)";
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    ctx.fillStyle = "#eef6ff";
    ctx.font = "700 24px Orbitron";
    ctx.textAlign = "center";
    ctx.fillText("CORE RUNNER", gameWidth / 2, gameHeight / 2 - 8);
    ctx.font = "600 14px Rajdhani";
    ctx.fillStyle = "rgba(238, 246, 255, 0.82)";
    ctx.fillText("Collect cyan cores. Dodge red glitches.", gameWidth / 2, gameHeight / 2 + 18);
  };

  const drawGame = () => {
    drawBackground();
    drawItems();
    drawPlayer();

    if (state.flashTimer > 0) {
      ctx.fillStyle = "rgba(255, 127, 127, 0.15)";
      ctx.fillRect(0, 0, gameWidth, gameHeight);
    }

    drawOverlay();
  };

  const updateGame = (timestamp) => {
    if (!state.running) {
      return;
    }

    if (!state.lastFrame) {
      state.lastFrame = timestamp;
    }

    const delta = Math.min((timestamp - state.lastFrame) / 1000, 0.032);
    state.lastFrame = timestamp;
    state.timeAccumulator += delta;
    state.spawnTimer += delta;
    state.flashTimer = Math.max(0, state.flashTimer - delta);

    state.stars.forEach((star) => {
      star.y += star.speed * delta;
      if (star.y > gameHeight) {
        star.y = -2;
      }
    });

    if (keys.left) {
      state.player.x -= state.player.speed * delta;
    }
    if (keys.right) {
      state.player.x += state.player.speed * delta;
    }

    const minX = state.player.width / 2 + 8;
    const maxX = gameWidth - state.player.width / 2 - 8;
    state.player.x = Math.max(minX, Math.min(maxX, state.player.x));

    if (state.spawnTimer >= 0.55) {
      spawnItem();
      state.spawnTimer = 0;
    }

    state.items = state.items.filter((item) => {
      item.y += item.speed * delta;
      item.x += item.drift * delta;

      const dx = Math.abs(item.x - state.player.x);
      const dy = Math.abs(item.y - state.player.y);
      const collided = dx < state.player.width / 2 + item.radius && dy < state.player.height + item.radius;

      if (collided) {
        if (item.type === "core") {
          state.score += 10;
          arcadeScore.textContent = String(state.score);
        } else {
          state.score = Math.max(0, state.score - 15);
          state.flashTimer = 0.15;
          arcadeScore.textContent = String(state.score);
        }

        return false;
      }

      return item.y < gameHeight + 24;
    });

    if (state.timeAccumulator >= 1) {
      state.timeAccumulator -= 1;
      state.timeLeft -= 1;
      arcadeTime.textContent = String(state.timeLeft);
    }

    if (state.timeLeft <= 0) {
      endGame();
      return;
    }

    drawGame();
    state.animationId = window.requestAnimationFrame(updateGame);
  };

  const startGame = () => {
    state.running = true;
    state.score = 0;
    state.timeLeft = 25;
    state.items = [];
    state.spawnTimer = 0;
    state.timeAccumulator = 0;
    state.lastFrame = 0;
    state.flashTimer = 0;
    state.player.x = gameWidth / 2;
    arcadeScore.textContent = "0";
    arcadeTime.textContent = "25";
    arcadeTrigger.textContent = "Run Active";
    setArcadeMessage("Run active. Collect the cores and avoid the glitches.");
    state.animationId = window.requestAnimationFrame(updateGame);
  };

  const movePlayerToPointer = (clientX) => {
    const rect = arcadeCanvas.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * gameWidth;
    const minX = state.player.width / 2 + 8;
    const maxX = gameWidth - state.player.width / 2 - 8;
    state.player.x = Math.max(minX, Math.min(maxX, relativeX));
  };

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = false;
    }
  });

  arcadeCanvas.addEventListener("mousemove", (event) => {
    if (!state.running) {
      return;
    }

    movePlayerToPointer(event.clientX);
  });

  arcadeCanvas.addEventListener(
    "touchmove",
    (event) => {
      if (!state.running) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      movePlayerToPointer(touch.clientX);
      event.preventDefault();
    },
    { passive: false }
  );

  arcadeTrigger.addEventListener("click", () => {
    window.cancelAnimationFrame(state.animationId);
    startGame();
  });

  resetGame();
}
