import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle2, Utensils, Flame, ShoppingBag, SplitSquareVertical } from "lucide-react";
import { RestaurantBrandId } from "./RestaurantSwitcher";

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBrand: (brandId: RestaurantBrandId) => void;
  onStartOrdering: (brandId: RestaurantBrandId) => void;
}

interface TourStep {
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  highlightBrand?: RestaurantBrandId;
  tip: string;
}

export function InteractiveTour({
  isOpen,
  onClose,
  onSelectBrand,
  onStartOrdering,
}: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDemoBrand, setSelectedDemoBrand] = useState<RestaurantBrandId>("brand_fryguy");

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      title: "Two Sister Kitchens Under One Roof",
      badge: "Step 1 of 4 • Concept",
      subtitle: "Experience American Crunch & Authentic Indian Classics Together",
      description:
        "Welcome to our unified dining space! Instead of limiting your table to just one cuisine, you can order simultaneously from both FRYGUY (crispy chicken & burgers) and Tarini's Kitchen (royal curries, tandoor & dum biryani).",
      icon: <Utensils className="w-8 h-8 text-amber-500" />,
      tip: "No need to choose between cravings—every person at your table can get what they love.",
    },
    {
      title: "Switch Menus Instantly with the Toggle Button",
      badge: "Step 2 of 4 • Navigation",
      subtitle: "No messy submenus or confusing layouts",
      description:
        "At the top of the menu, you'll find the Restaurant Toggle. Simply tap FRYGUY or Tarini's Kitchen to flip the entire menu in real time. Notice the categories, spices, and exact prices adjust automatically!",
      icon: <SplitSquareVertical className="w-8 h-8 text-red-500" />,
      tip: "Try toggling the buttons below right now to see how quick it switches!",
    },
    {
      title: "Mix & Match Into One Single Cart",
      badge: "Step 3 of 4 • Ordering",
      subtitle: "Add items from both kitchens seamlessly",
      description:
        "You can add a Crunchy Nashville Burger from FRYGUY, then toggle over to Tarini's Kitchen and add a rich Paneer Tikka or Hyderabadi Dum Biryani. Both stay organized in your single unified cart.",
      icon: <ShoppingBag className="w-8 h-8 text-emerald-500" />,
      tip: "Each kitchen gets its own printed KOT instantly so your food arrives hot & fresh together.",
    },
    {
      title: "Direct Table Delivery & One Unified Bill",
      badge: "Step 4 of 4 • Checkout",
      subtitle: "Dine-in comfort with clear, transparent pricing",
      description:
        "When you're ready, hit checkout. We route each dish to its dedicated chef station, and our service team serves everything piping hot straight to your table number with a single itemized digital invoice.",
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
      tip: "Ready to explore? Choose your starting kitchen below and start tasting!",
    },
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onStartOrdering(selectedDemoBrand);
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSwitchBrand = (brandId: RestaurantBrandId) => {
    setSelectedDemoBrand(brandId);
    onSelectBrand(brandId);
  };

  return (
    <div
      id="tour-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="tour-card"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
              {step.badge}
            </span>
          </div>
          <button
            type="button"
            id="tour-btn-close"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Step Icon & Title */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center shrink-0 shadow-inner">
              {step.icon}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm font-medium text-stone-500 mt-1">
                {step.subtitle}
              </p>
            </div>
          </div>

          <p className="text-stone-700 text-base leading-relaxed">
            {step.description}
          </p>

          {/* Interactive Toggle Demonstration Widget (Step 2 and beyond) */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>Interactive Navigation Simulator:</span>
              <span className="text-stone-400 font-normal">Tap to switch</span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-stone-200/70 p-1.5 rounded-xl">
              <button
                type="button"
                id="tour-demo-fryguy"
                onClick={() => handleSwitchBrand("brand_fryguy")}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedDemoBrand === "brand_fryguy"
                    ? "bg-[#ED1C24] text-white shadow-sm"
                    : "text-stone-600 hover:bg-white/50"
                }`}
              >
                <span>🍗</span>
                <span>FRYGUY</span>
              </button>

              <button
                type="button"
                id="tour-demo-tarini"
                onClick={() => handleSwitchBrand("brand_tarini")}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedDemoBrand === "brand_tarini"
                    ? "bg-[#C98200] text-white shadow-sm"
                    : "text-stone-600 hover:bg-white/50"
                }`}
              >
                <span>🍛</span>
                <span>Tarini's Kitchen</span>
              </button>
            </div>

            {/* Quick Preview Card */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/70 flex items-center gap-3">
              <img
                src={
                  selectedDemoBrand === "brand_fryguy"
                    ? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80"
                    : "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80"
                }
                alt="Demo preview"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {selectedDemoBrand === "brand_fryguy"
                    ? "Original Crispy Chicken Burger"
                    : "Chicken Dum Biryani (Hyderabadi)"}
                </p>
                <p className="text-[11px] text-stone-500">
                  {selectedDemoBrand === "brand_fryguy"
                    ? "FRYGUY Menu • ₹149"
                    : "Tarini's Kitchen Menu • ₹159"}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                Active
              </span>
            </div>
          </div>

          {/* Practical Pro Tip */}
          <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Tip: </strong>
              {step.tip}
            </span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-stone-50/90 border-t border-stone-100 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  idx === currentStep
                    ? "w-6 bg-stone-900"
                    : "w-2 bg-stone-300 hover:bg-stone-400"
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                id="tour-btn-prev"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl text-stone-600 font-semibold text-xs sm:text-sm hover:bg-stone-200/70 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              id="tour-btn-next"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs sm:text-sm hover:bg-stone-800 transition-all flex items-center gap-1.5 shadow-md shadow-stone-900/10"
            >
              <span>{currentStep === steps.length - 1 ? "Start Ordering Now" : "Next"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
