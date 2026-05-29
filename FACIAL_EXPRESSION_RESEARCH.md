# Facial Expression And Gaze Research Notes

## Working Stance

The face should not try to "read emotion." It should show interaction posture: attending, reading, thinking, holding the turn, yielding the turn, speaking, recovering, and idling.

The research pattern is consistent: facial movement becomes meaningful through timing, gaze direction, dynamics, and context. A minimal face is strongest when it uses a small vocabulary of legible motion instead of pretending to represent a full inner emotional state.

## Evidence

### FACS Is A Movement Vocabulary, Not A Mind Reader

The Facial Action Coding System describes visually discernible facial movement by decomposing it into Action Units. The useful takeaway for this prototype is structural: think in small controllable motions of brows, eyelids, eyes, and mouth.

Relevant controls for a minimal face:

- Brows: inner raise, outer raise, brow lower/compress, asymmetry.
- Eyes: aperture, pupil position, gaze direction, blink.
- Mouth: corner pull, corner relax, small open/close speaking motion, asymmetry.
- Head/face frame: slight tilt, return-to-center, tiny anticipation before a state change.

Source: Paul Ekman Group FACS overview, which describes FACS as anatomically based and built around Action Units.  
https://www.paulekman.com/facial-action-coding-system/

### Be Careful With Emotion Labels

Barrett et al. argue that it is more accurate to talk about "facial actions," "facial configurations," or "patterns of facial movement" than to assume a facial movement directly broadcasts an emotion. Context matters, posed exaggerated faces can mislead, and dynamics matter more than static configurations.

Design implication: the app should label internal states as posture or interaction state where possible. "Thinking," "ready," "listening," and "uncertain" are safer than "sad," "angry," or "happy." Local reflexes should stay reversible and modest until OpenAI speculation returns.

Source: Barrett et al., "Emotional Expressions Reconsidered."  
https://journals.sagepub.com/doi/10.1177/1529100619832930

### Gaze Aversion Is Useful For Thinking And Turn Management

Gaze aversion in virtual agents can communicate thinking, regulate turn-taking, and affect disclosure. Microsoft Research's virtual-agent work found that gaze-averting agents were perceived as thinking, elicited more disclosure, and helped regulate turn-taking.

Design implication: a thinking face should not stare. It should glance away or down briefly, then return gaze when it has something ready. Direct gaze should be used sparingly as a readiness/yielding cue, not as the default for every state.

Source: Microsoft Research, "Conversational Gaze Aversion for Virtual Agents."  
https://www.microsoft.com/en-us/research/publication/conversational-gaze-aversion-for-virtual-agents/

### Conversation Gaze Is Adaptive, Not A Single Rule

A review of gaze in turn-taking shows that gaze has roles in monitoring, turn-holding, turn-yielding, interruption, and next-speaker selection, but results vary by context. Speakers often direct gaze near turn completion, listeners often gaze at speakers, and gaze aversion can help hold a turn or concentrate.

Design implication: use gaze as a conversational signal:

- Listening/reading: steady but soft attention.
- Thinking/holding: gaze away or down.
- Ready/yielding: return gaze to center.
- Interrupted/canceled: quick reset to the user's new input.

Source: Degutyte and Astell, "The Role of Eye Gaze in Regulating Turn Taking in Conversations."  
https://centaur.reading.ac.uk/98769/1/fpsyg-12-616471.pdf

### Natural Gaze Has Eye-Head-Lid Coordination

Virtual-agent gaze research points out that realistic gaze shifts are not just moving pupils. Eyes and head have latency, velocity profiles, range limits, and alignment preferences. Subtle random eye movement and idle cues help avoid rigidity.

Design implication for this flat SVG: approximate the same hierarchy cheaply:

1. Pupils move first.
2. Brows/mouth/face tilt settle after.
3. A blink can occasionally cover a gaze transition.
4. Idle gaze should be small and slow, not jittery.

Source: Andrist et al., "Designing Effective Gaze Mechanisms for Virtual Agents."  
https://graphics.cs.wisc.edu/Papers/2012/APMG12/APMG12.pdf

### Blinks Should Be Asymmetric And State-Aware

Research on blink animation found that natural human blinks are spatially and temporally asymmetric, and that data-driven full blinks were perceived as more natural than textbook symmetric blink curves. Separate eye-tracking work also suggests blink rates vary by task: reading tends to reduce blink rate, while conversation tends to increase it.

Design implication:

- Avoid identical metronomic blinks.
- Blink down faster than up.
- Use occasional longer reopen after thinking.
- Blink less while actively reading user text.
- Blink at gaze transitions, especially when moving from thinking back to ready.

Sources:  
Trutoiu et al., "Modeling and animating eye blinks."  
https://publications.ri.cmu.edu/modeling-and-animating-eye-blinks

Blink-rate task comparison, PubMed record.  
https://pubmed.ncbi.nlm.nih.gov/36763349/

### Minimal Faces Communicate Broadly, Not Finely

Simple robot-face work suggests that eyes and mouth can communicate broad affective categories, but fine distinctions are hard. A more recent robot-face study also found that emotion recognition drops when only the eye region is visible.

Design implication: keep the face minimal, but use the whole minimal face: eyes, brows, mouth, and face tilt. Do not ask the brows alone to carry too much.

Sources:  
Sobrepera et al., "Designing and Evaluating the Face of Lil'Flo."  
https://pubmed.ncbi.nlm.nih.gov/31374720/

"Perception of Emotions in Human and Robot Faces: Is the Eye Region Enough?"  
https://arxiv.org/abs/2410.14337

## Motion Grammar For This Prototype

### Idle

- Center gaze with very small drift.
- Breathing line remains slow.
- Blink interval medium and irregular.
- Mouth is almost neutral, not a constant smile.

### User Is Typing / Reading

- Gaze shifts slightly downward, as if attending to the text.
- Blink rate decreases.
- Brows lift or compress only lightly.
- Avoid a strong smile: the face is reading, not approving.

### User Pauses Mid-Thought

- Gaze holds softly, then drifts off-axis if the sentence appears unfinished.
- Mouth relaxes into a small neutral line.
- Brow movement should indicate "still with you," not "confused."

### Speculation / Thinking

- Brief gaze aversion down-left or down-right.
- Small brow compression or asymmetry.
- One transition blink can cover the shift.
- Return to center only when confidence/completion is high.

### Ready / Yielding

- Return gaze to the user.
- Slight mouth lift, small and warm.
- Brows open a little.
- This is the "you can send / I am ready" posture.

### Speaking

- Mouth animates with restrained vertical movement.
- Eyes do not stare continuously; add tiny gaze release or blink during longer responses.
- On sentence completion, settle back into ready.

### Interrupted / Canceled

- Immediately reset toward reading/listening.
- Clear speech mouth motion.
- Gaze snaps gently back toward the new draft.
- Metrics trace should show the cancellation, but the face should simply re-attend.

## Timing Targets

These are practical animation targets, not hard physiological claims:

- Local reaction: 0-16 ms after input event.
- Eye/pupil shift: 60-140 ms.
- Brow/mouth settle: 120-260 ms.
- Thinking gaze aversion: hold 400-1200 ms, then return if ready.
- Blink close: 45-70 ms.
- Blink closed hold: 25-60 ms.
- Blink reopen: 90-160 ms.
- Gaze-transition blink: begin within 50 ms of the gaze shift.

## Presence Levels

Presence should change expressive gain, not the agent's mind.

- Still: fewer blinks, smaller gaze shifts, almost no tilt, slower settling.
- Attentive: readable gaze and mouth changes, restrained brow movement.
- Expressive: faster settling, stronger gaze aversion, larger but still elegant brow/mouth motion.

## Implementation Candidates

1. Add semantic gaze targets: `center`, `text`, `thinking-left`, `thinking-right`, `yield`.
2. Make blink timing state-aware, not only presence-aware.
3. Make blinks asymmetric: quick close, tiny hold, slower reopen.
4. Add transition blinks for large gaze changes and thinking-to-ready.
5. Replace random micro-gaze jitter with slow target drift plus occasional small eye darts.
6. Treat OpenAI speculation as posture refinement: "question," "repair," "forming," "settled," not raw emotion.
7. Keep labels and metrics grounded in interaction posture, avoiding claims that the user is angry, sad, happy, etc.

## Product Rule

The face should feel like attention, not interpretation.

When uncertain, it should under-act.
