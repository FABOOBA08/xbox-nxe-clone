import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import Background from "/Users/tecno/xbox-nxe-clone/src/assets/Background.webp";
import "./Carousel.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error en Carousel:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Algo salió mal con el carrusel.</h2>
          <button onClick={() => window.location.reload()}>Recargar</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Carousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const tileRefs = useRef([]);
  const titleRefs = useRef([]);
  const prevIndexRef = useRef(0);
  const directionRef = useRef('next');
  const containerRef = useRef();

  const tiles = [
    { id: 1, title: "My Xbox", subtitle: "Console Settings", icon: "⚙️", color: "#107C10" },
    { id: 2, title: "Games", subtitle: "Play Game", icon: "🎮", color: "#0E7A0D" },
    { id: 3, title: "Media", subtitle: "Videos & Music", icon: "🎵", color: "#0E7A0D" },
    { id: 4, title: "System", subtitle: "Memory & Settings", icon: "💾", color: "#107C10" },
    { id: 5, title: "Store", subtitle: "Get Games & Apps", icon: "🛒", color: "#0E7A0D" },
    { id: 6, title: "Social", subtitle: "Friends & Parties", icon: "👥", color: "#107C10" },
  ];

  const playSwipeSound = () => {
    try {
      const sound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3");
      sound.volume = 0.2;
      sound.play().catch(e => console.warn("Error al reproducir sonido:", e));
    } catch (error) {
      console.warn("Error al crear audio:", error);
    }
  };

  const animateExit = (index, direction) => {
    if (!tileRefs.current[index]) return;
    return gsap.to(tileRefs.current[index], {
      scale: direction === 'next' ? 1.5 : 0.8,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
      zIndex: 20,
      boxShadow: "0 0 40px rgba(16, 124, 16, 0.8)",
    });
  };

  const animateEntry = (index, direction) => {
    if (!tileRefs.current[index]) return;
    const fromX = direction === 'next' ? 400 : -400;
    return gsap.fromTo(tileRefs.current[index], 
      {
        x: fromX,
        opacity: 0,
        scale: direction === 'next' ? 0.8 : 1.2,
      },
      {
        x: 80,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.2)",
        zIndex: 10
      }
    );
  };

  const updateCarousel = () => {
    if (!containerRef.current) return;
    
    const baseXPosition = 80;
    const tl = gsap.timeline();

    // Animación de tiles
    if (prevIndexRef.current !== activeIndex && tileRefs.current[prevIndexRef.current]) {
      tl.add(animateExit(prevIndexRef.current, directionRef.current));
    }

    if (tileRefs.current[activeIndex]) {
      tl.add(animateEntry(activeIndex, directionRef.current), "<");
    }

    // Elementos a la derecha
    let stt = 0;
    for (let i = activeIndex + 1; i < tiles.length; i++) {
      stt++;
      if (tileRefs.current[i]) {
        tl.to(tileRefs.current[i], {
          x: baseXPosition + (stt * 280),
          scale: 1 - 0.1 * stt,
          zIndex: 10 - stt,
          opacity: stt > 3 ? 0 : 0.8,
          rotateY: -1,
          duration: 0.5
        }, "<");
      }
    }

    // Ocultar elementos a la izquierda
    for (let i = 0; i < activeIndex; i++) {
      if (tileRefs.current[i]) {
        tl.to(tileRefs.current[i], {
          x: -window.innerWidth,
          opacity: 0,
          duration: 0.5,
          zIndex: 0
        }, "<");
      }
    }

    // Animación de títulos
    if (prevIndexRef.current !== activeIndex && titleRefs.current[prevIndexRef.current]) {
      tl.to(titleRefs.current[prevIndexRef.current], {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        zIndex: 0
      }, 0);
    }

    if (titleRefs.current[activeIndex]) {
      tl.fromTo(titleRefs.current[activeIndex], 
        {
          y: 50,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.2)",
          zIndex: 10
        },
        0
      );
    }

    // Títulos adyacentes
    tiles.forEach((_, index) => {
      if (index !== activeIndex && titleRefs.current[index]) {
        const distance = Math.abs(index - activeIndex);
        tl.to(titleRefs.current[index], {
          y: 20 * distance,
          opacity: 1 - distance * 0.3,
          zIndex: 10 - distance,
          duration: 0.5
        }, 0);
      }
    });

    prevIndexRef.current = activeIndex;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const handleNext = () => {
    directionRef.current = 'next';
    playSwipeSound();
    setActiveIndex(prev => (prev + 1) % tiles.length);
  };

  const handlePrev = () => {
    directionRef.current = 'prev';
    playSwipeSound();
    setActiveIndex(prev => (prev - 1 + tiles.length) % tiles.length);
  };

  useEffect(() => {
    updateCarousel();
  }, [activeIndex]);

  return (
    <ErrorBoundary>
      <div className="xbox-dashboard" ref={containerRef}>
        <div className="xbox-background" style={{ backgroundImage: `url(${Background})` }}></div>
        
        <div className="xbox-titles-container">
          {tiles.map((tile, index) => (
            <div
              key={`title-${tile.id}`}
              ref={el => titleRefs.current[index] = el}
              className="xbox-title"
            >
              {tile.title}
            </div>
          ))}
        </div>
        
        <div className="xbox-container">
          {tiles.map((tile, index) => (
            <div
              key={tile.id}
              ref={el => tileRefs.current[index] = el}
              className="xbox-blade"
              style={{ backgroundColor: tile.color }}
              tabIndex="0"
            >
              <div className="blade-content">
                <div className="blade-icon">{tile.icon}</div>
                <div className="blade-text">
                  <h3>{tile.title}</h3>
                  <p>{tile.subtitle}</p>
                </div>
              </div>
              <div className="blade-highlight"></div>
            </div>
          ))}
        </div>

        <div className="xbox-controls">
          <span className="counter-text">{`${activeIndex + 1} of ${tiles.length}`}</span>
          <button className="xbox-button prev" onClick={handlePrev} aria-label="Anterior">
            <svg className="arrow-icon" viewBox="0 0 24 24">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
          </button>
          <button className="xbox-button next" onClick={handleNext} aria-label="Siguiente">
            <svg className="arrow-icon" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Carousel;