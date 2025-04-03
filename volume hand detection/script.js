 const video = document.querySelector("#video");
const audio = document.querySelector("#audio");
let model;
let lastHandPosition = null;
let isMuted = false;
let lastVolume = 0.5; // Store last volume before muting

// Load Handpose Model
async function loadHandposeModel() {
    model = await handpose.load();
    console.log("✅ Handpose Model Loaded!");
    trackHand();
}

// Detect Hand & Adjust Volume Smoothly
async function trackHand() {
    if (!model) return;

    const predictions = await model.estimateHands(video);

    if (predictions.length > 0) {
        const hand = predictions[0];

        // Count extended fingers
        let extendedFingers = hand.landmarks.filter((point, index) =>
            [4, 8, 12, 16, 20].includes(index) && point[1] < hand.landmarks[0][1]
        ).length;

        if (extendedFingers >= 4) { 
            // 🖐️ Hand Open → Unmute & Adjust Volume
            if (isMuted) {
                audio.muted = false;
                audio.volume = lastVolume; // Restore previous volume
                isMuted = false;
                console.log("🔊 Unmuted → Restored Volume");
            }

            let handY = hand.boundingBox.topLeft[1];

            if (lastHandPosition !== null) {
                let movement = Math.abs(handY - lastHandPosition);
                if (movement < 5) { // Ignore very small movements
                    requestAnimationFrame(trackHand);
                    return;
                }
            }

            lastHandPosition = handY;

            // Normalize Y position to volume (0 to 1) with smoothing
            let newVolume = 1 - Math.min(Math.max(handY / 500, 0), 1);
            audio.volume = (audio.volume * 0.85) + (newVolume * 0.15); // Smoother transition
            lastVolume = audio.volume; // Save last volume before muting
            console.log(`🎚️ Adjusting Volume → ${audio.volume.toFixed(2)}`);
        } 
        else if (extendedFingers === 0 && !isMuted) { 
            // ✊ Hand Closed (Fist) → Mute
            audio.muted = true;
            isMuted = true;
            console.log("🔇 Muted");
        }
    }

    requestAnimationFrame(trackHand);
}

// Start Webcam
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    loadHandposeModel();
}).catch((err) => console.error("❌ Camera Error:", err));
