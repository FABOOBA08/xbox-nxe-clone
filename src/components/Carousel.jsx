import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const tileRefs = useRef([]);
  const titleRefs = useRef([]);
  const prevIndexRef = useRef(0);
  const directionRef = useRef('next');
  const containerRef = useRef();
  const animationTimeline = useRef(null);

  const tiles = [
    { id: 1, title: "My Xbox", subtitle: "Console Settings", icon: "⚙️", color: "#107C10" },
    { id: 2, title: "Games", subtitle: "Play Game", icon: "🎮", color: "#0E7A0D" },
    { id: 3, title: "Media", subtitle: "Videos & Music", icon: "🎵", color: "#0E7A0D" },
    { id: 4, title: "System", subtitle: "Memory & Settings", icon: "💾", color: "#107C10" },
    { id: 5, title: "Store", subtitle: "Get Games & Apps", icon: "🛒", color: "#0E7A0D" },
    { id: 6, title: "Social", subtitle: "Friends & Parties", icon: "👥", color: "#107C10" },
  ];

  const playSwipeSound = useCallback(() => {
    try {
      const sound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3");
      sound.volume = 0.2;
      sound.play().catch(e => console.warn("Error al reproducir sonido:", e));
    } catch (error) {
      console.warn("Error al crear audio:", error);
    }
  }, []);

  // ANIMACIONES ORIGINALES DE LOS CONTENEDORES (BLOQUES)
  const animateExit = useCallback((index, direction) => {
    if (!tileRefs.current[index]) return;
    return gsap.to(tileRefs.current[index], {
      scale: direction === 'next' ? 1.5 : 0.8,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
      zIndex: 20,
      boxShadow: "0 0 40px rgba(16, 124, 16, 0.8)",
    });
  }, []);

  const animateEntry = useCallback((index, direction) => {
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
  }, []);

  // ANIMACIONES DE TÍTULOS (ABAJO HACIA ARRIBA - VERSIÓN QUE ESTABA PERFECTA)
  const animateTitleExit = useCallback((index, direction) => {
    if (!titleRefs.current[index]) return;
    return gsap.to(titleRefs.current[index], {
      y: direction === 'next' ? -150 : 50,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
    });
  }, []);

  const animateTitleEntry = useCallback((index, direction) => {
    if (!titleRefs.current[index]) return;
    const fromY = direction === 'next' ? 100 : -100;
    return gsap.fromTo(titleRefs.current[index], 
      {
        y: fromY,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.2)",
      }
    );
  }, []);

  const updateCarousel = useCallback(() => {
    if (!containerRef.current) return;
    
    // Cancelar animaciones previas
    if (animationTimeline.current) {
      animationTimeline.current.kill();
    }
    gsap.killTweensOf([...tileRefs.current, ...titleRefs.current]);
    
    setIsAnimating(true);
    
    const baseXPosition = 80;
    animationTimeline.current = gsap.timeline({
      onComplete: () => setIsAnimating(false)
    });

    // ANIMACIÓN ORIGINAL DE CONTENEDORES (BLOQUES)
    if (prevIndexRef.current !== activeIndex && tileRefs.current[prevIndexRef.current]) {
      animationTimeline.current.add(animateExit(prevIndexRef.current, directionRef.current));
    }

    if (tileRefs.current[activeIndex]) {
      animationTimeline.current.add(animateEntry(activeIndex, directionRef.current), "<");
    }

    // Elementos a la derecha (original)
    let stt = 0;
    for (let i = activeIndex + 1; i < tiles.length; i++) {
      stt++;
      if (tileRefs.current[i]) {
        animationTimeline.current.to(tileRefs.current[i], {
          x: baseXPosition + (stt * 280),
          scale: 1 - 0.1 * stt,
          zIndex: 10 - stt,
          opacity: stt > 3 ? 0 : 0.8,
          rotateY: -1,
          duration: 0.5
        }, "<");
      }
    }

    // Ocultar elementos a la izquierda (original)
    for (let i = 0; i < activeIndex; i++) {
      if (tileRefs.current[i]) {
        animationTimeline.current.to(tileRefs.current[i], {
          x: -window.innerWidth,
          opacity: 0,
          duration: 0.5,
          zIndex: 0
        }, "<");
      }
    }

    // ANIMACIÓN DE TÍTULOS (ABAJO HACIA ARRIBA - VERSIÓN QUE ESTABA PERFECTA)
    // Animación de salida del título anterior (solo el principal)
    if (prevIndexRef.current !== activeIndex && titleRefs.current[prevIndexRef.current]) {
      animationTimeline.current.add(animateTitleExit(prevIndexRef.current, directionRef.current), "<0.1");
    }

    // Animación de entrada del nuevo título
    if (titleRefs.current[activeIndex]) {
      animationTimeline.current.add(animateTitleEntry(activeIndex, directionRef.current), "<0.1");
    }

    // Animación de títulos secundarios (efecto cascada)
    const visibleSecondaryTitles = 2;
    const titleSpacing = 40;
    
    for (let i = 1; i <= visibleSecondaryTitles; i++) {
      const nextIdx = (activeIndex + i) % tiles.length;
      const prevIdx = (activeIndex - i + tiles.length) % tiles.length;
      
      // Títulos siguientes
      if (titleRefs.current[nextIdx]) {
        animationTimeline.current.to(titleRefs.current[nextIdx], {
          y: i * titleSpacing,
          scale: 1 - (i * 0.1),
          opacity: 1 - (i * 0.5),
          duration: 0.5,
          ease: "power2.out"
        }, "<0.1");
      }
      
      // Títulos anteriores (ocultar)
      if (titleRefs.current[prevIdx]) {
        animationTimeline.current.to(titleRefs.current[prevIdx], {
          y: -titleSpacing,
          opacity: 0,
          duration: 0.3
        }, "<");
      }
    }

    prevIndexRef.current = activeIndex;
  }, [activeIndex, animateEntry, animateExit, animateTitleEntry, animateTitleExit, tiles.length]);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    directionRef.current = 'next';
    playSwipeSound();
    setActiveIndex(prev => (prev + 1) % tiles.length);
  }, [isAnimating, playSwipeSound, tiles.length]);

  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    directionRef.current = 'prev';
    playSwipeSound();
    setActiveIndex(prev => (prev - 1 + tiles.length) % tiles.length);
  }, [isAnimating, playSwipeSound, tiles.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  useEffect(() => {
    updateCarousel();
  }, [activeIndex, updateCarousel]);

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
              style={{ zIndex: index === activeIndex ? 30 : 20 - Math.abs(index - activeIndex) }}
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
          <button 
            className="xbox-button prev" 
            onClick={handlePrev} 
            aria-label="Anterior"
            disabled={isAnimating}
          >
            <svg className="arrow-icon" viewBox="0 0 24 24">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
          </button>
          <button 
            className="xbox-button next" 
            onClick={handleNext} 
            aria-label="Siguiente"
            disabled={isAnimating}
          >
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