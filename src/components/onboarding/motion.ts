// Shared choreography for onboarding screen transitions: soft, slow, dreamy —
// title exits first, then the visual gently moves, then the next screen's
// content fades/slides in. staggerChildren on the container gives that
// layered timing "for free" as long as title/visual/footer are the direct
// children in that DOM order.
export const EASE = [0.22, 1, 0.36, 1] as const;

export const screenVariants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.1 } },
};

export const titleVariants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.32, ease: EASE } },
};

export const visualVariants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
  exit: { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.45, ease: EASE } },
};

// Opacity-only variant for the step illustration slot: some illustrations
// (the Step 2 orb) rely on `mix-blend-mode` reaching all the way through to
// the page background, which only works if none of their ancestors have a
// transform (any non-"none" transform value forms a stacking context that
// traps the blend mode — see OnboardingStep.module.css .illustration notes).
// Framer Motion keeps a live `transform` inline style even at rest, so the
// illustration wrapper can only animate opacity, not position/scale.
export const illustrationVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.7, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.45, ease: EASE } },
};

export const footerVariants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.28, ease: EASE } },
};
