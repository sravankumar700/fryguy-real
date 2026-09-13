import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Utensils, Flame, Sparkles, RefreshCw, Eye } from "lucide-react";

export interface Food3DItem {
  id: string;
  name: string;
  subtitle: string;
  brand: string;
  brandColor: string;
  tag: string;
  price: string;
  image: string;
  accentGradient: string;
  badges: string[];
  notes: string;
  categoryName: string;
}

const FOOD_ITEMS: Food3DItem[] = [
  {
    id: "burger",
    name: "Signature Double Smash Burger",
    subtitle: "Two seared Angus patties, molten cheddar cascade & glazed brioche",
    brand: "FRYGUY",
    brandColor: "#ED1C24",
    tag: "American Sizzle",
    price: "₹249",
    image: "/3d-burger.jpg",
    accentGradient: "from-red-500/20 via-orange-500/10 to-transparent",
    badges: ["Double Angus Beef", "Molten Cheddar", "Crispy Edges"],
    notes: "Freshly smashed on a 450°F seasoned iron flat-top",
    categoryName: "Burgers",
  },
  {
    id: "biryani",
    name: "Royal Hyderabadi Clay Dum Biryani",
    subtitle: "Long-grain saffron basmati, caramelized onions & slow charcoal dum",
    brand: "Tarini's Kitchen",
    brandColor: "#C98200",
    tag: "Royal Heritage",
    price: "₹349",
    image: "/3d-biryani.jpg",
    accentGradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    badges: ["Slow Charcoal Dum", "Kashmiri Saffron", "Tender Spiced Cuts"],
    notes: "Sealed with dough and slow-steamed for 4 hours",
    categoryName: "Royal Dum Biryani",
  },
  {
    id: "fries",
    name: "Nashville Hot Wings & Golden Fries",
    subtitle: "Fiery cayenne crunch glaze, crinkle-cut fries & homemade dipping sauce",
    brand: "FRYGUY",
    brandColor: "#ED1C24",
    tag: "Fiery Crunch",
    price: "₹279",
    image: "/3d-fries.jpg",
    accentGradient: "from-rose-500/20 via-red-500/10 to-transparent",
    badges: ["12-Hr Buttermilk Dip", "Fiery Nashville Heat", "Golden Crinkle Crunch"],
    notes: "Double-fried in peanut oil for uncompromised crunch",
    categoryName: "Nashville Chicken",
  },
];

interface Animated3DFoodStageProps {
  onSelectFoodCategory?: (categoryName: string) => void;
}

export function Animated3DFoodStage({ onSelectFoodCategory }: Animated3DFoodStageProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeItem = FOOD_ITEMS[activeIdx];

  // Mouse 3D tilt calculations
  const stageRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);

  // Auto-switch food every 6 seconds if not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % FOOD_ITEMS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-12 to +12 degrees)
    const rotX = -((y - centerY) / centerY) * 14;
    const rotY = ((x - centerX) / centerX) * 16;
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      id="interactive-3d-food-stage"
      className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#1C1A17] via-[#141210] to-[#0D0B0A] border border-stone-800/90 shadow-2xl p-6 sm:p-8"
    >
      {/* Background Ambient Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-30"
        style={{
          background: `radial-gradient(circle at 60% 50%, ${activeItem.brandColor} 0%, transparent 65%)`,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Dish Information & Controls */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Header pill */}
          <div className="flex items-center gap-2.5">
            <span
              className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-xs"
              style={{ backgroundColor: activeItem.brandColor }}
            >
              {activeItem.brand}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-stone-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
              {activeItem.tag}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold ml-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Interactive 3D Food</span>
            </span>
          </div>

          {/* Dish Title & Description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                {activeItem.name}
              </h2>
              <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-normal">
                {activeItem.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* 3D Features / Quality Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {activeItem.badges.map((badge, i) => (
              <motion.span
                key={badge}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-stone-200 backdrop-blur-xs flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{badge}</span>
              </motion.span>
            ))}
          </div>

          {/* Culinary Craft Note */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-stone-400 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">{activeItem.notes}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Freshly prepared & served hot</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-stone-400">Starting At</span>
              <p className="text-2xl font-black text-white">{activeItem.price}</p>
            </div>

            <button
              type="button"
              id={`3d-stage-order-btn-${activeItem.id}`}
              onClick={() => {
                if (onSelectFoodCategory) {
                  onSelectFoodCategory(activeItem.categoryName);
                }
              }}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl font-black text-sm text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: activeItem.brandColor }}
            >
              <span>Explore in Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 3D tilt hint */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Hover & move to tilt in 3D</span>
            </div>
          </div>

          {/* Food Dish Switcher Selector Tabs */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Select 3D Food Showcase:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {FOOD_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  id={`select-3d-food-${item.id}`}
                  onClick={() => setActiveIdx(idx)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeIdx === idx
                      ? "bg-white/15 border-amber-400/80 text-white shadow-md shadow-black/40 scale-[1.02]"
                      : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <p className="text-xs font-black truncate">{item.name}</p>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">{item.brand}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Canvas Stage */}
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[360px] sm:min-h-[420px] cursor-grab active:cursor-grabbing select-none"
          style={{ perspective: "1000px" }}
        >
          {/* Animated 3D Container with Parallax & Continuous Hover Physics */}
          <motion.div
            animate={{
              y: isHovered ? [0, -10, 0] : [0, -16, 0],
              rotateX: isHovered ? rotateX : [0, 4, -4, 0],
              rotateY: isHovered ? rotateY : [0, -6, 6, 0],
              rotateZ: [0, 1, -1, 0],
            }}
            transition={{
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              rotateX: isHovered
                ? { type: "spring", stiffness: 300, damping: 20 }
                : { repeat: Infinity, duration: 6, ease: "easeInOut" },
              rotateY: isHovered
                ? { type: "spring", stiffness: 300, damping: 20 }
                : { repeat: Infinity, duration: 8, ease: "easeInOut" },
              rotateZ: { repeat: Infinity, duration: 7, ease: "easeInOut" },
            }}
            className="relative w-full max-w-sm sm:max-w-md aspect-square flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* 3D Circular Ambient Glow Plate */}
            <div
              className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-2xl opacity-40 transition-colors duration-500 pointer-events-none"
              style={{ backgroundColor: activeItem.brandColor }}
            />

            {/* Orbiting 3D Particle Accents */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <span className="absolute -top-3 left-1/4 text-xl drop-shadow-md">✨</span>
              <span className="absolute bottom-4 right-1/4 text-xl drop-shadow-md">🔥</span>
              <span className="absolute top-1/2 -right-4 text-lg drop-shadow-md">🌿</span>
              <span className="absolute top-1/3 -left-4 text-lg drop-shadow-md">⭐</span>
            </motion.div>

            {/* Food Image with 3D Depth Clipping */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, scale: 0.85, rotateY: 30 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.85, rotateY: -30 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
                style={{
                  boxShadow: `0 25px 50px -12px ${activeItem.brandColor}40, 0 0 35px rgba(0,0,0,0.8)`,
                  transform: "translateZ(30px)",
                }}
              >
                <img
                  src={activeItem.image}
                  alt={activeItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Shimmer / Light Flare Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 pointer-events-none" />

                {/* Floating 3D Badge on image corner */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>3D Fresh</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 3D Floating Shadow on the floor */}
            <motion.div
              animate={{
                scale: isHovered ? [0.85, 0.95, 0.85] : [0.8, 1, 0.8],
                opacity: isHovered ? [0.5, 0.7, 0.5] : [0.4, 0.65, 0.4],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-8 w-56 sm:w-72 h-10 rounded-full bg-black/80 blur-xl pointer-events-none"
              style={{ transform: "translateZ(-40px) rotateX(70deg)" }}
            />
          </motion.div>

          {/* Interactive 3D indicator at bottom */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-stone-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>3D Interactive Live Motion</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev + 1) % FOOD_ITEMS.length)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/15 transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Next 3D Food</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
