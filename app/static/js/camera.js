// Surveillance Camera Stream Controller
const CameraController = {
  videoElement: null,
  stream: null,
  isEnabled: true,

  init() {
    this.videoElement = document.getElementById('cameraFeed');
    const toggleBtn = document.getElementById('btnToggleCamera');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCamera());
    }

    this.startHUDClock();
    this.startCamera();
  },

  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.updateStatus('CAMERA NOT SUPPORTED IN BROWSER', false);
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false // Privacy: Zero audio streaming
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
      }
      this.isEnabled = true;
      this.updateStatus('STREAM: ACTIVE (LOCAL MIRROR)', true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      this.updateStatus('CAMERA ACCESS DENIED // SIMULATION ACTIVE', false);
    }
  },

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isEnabled = false;
    this.updateStatus('STREAM: MUTED', false);
  },

  toggleCamera() {
    const toggleBtn = document.getElementById('btnToggleCamera');
    if (this.isEnabled) {
      this.stopCamera();
      if (toggleBtn) toggleBtn.textContent = 'Enable Camera';
    } else {
      this.startCamera();
      if (toggleBtn) toggleBtn.textContent = 'Disable Camera';
    }
  },

  updateStatus(text, isActive) {
    const statusElem = document.getElementById('streamStatus');
    if (statusElem) {
      statusElem.textContent = text;
      statusElem.style.color = isActive ? 'var(--accent-red)' : 'var(--text-muted)';
    }
  },

  startHUDClock() {
    const hudTime = document.getElementById('hudTimestamp');
    if (!hudTime) return;
    setInterval(() => {
      const now = new Date();
      hudTime.textContent = now.toTimeString().split(' ')[0] + ' UTC';
    }, 1000);
  }
};
