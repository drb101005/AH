import tkinter as tk
from tkinter import scrolledtext
import pyttsx3
import threading


class TextReader:
    def __init__(self, root):
        self.root = root

        # -----------------------------
        # State
        # -----------------------------
        self.text = ""
        self.position = 0

        self.reading = False
        self.space_down = False
        self.stop_requested = False

        self.engine = None
        self.engine_lock = threading.Lock()

        # Speech speed
        self.speech_rate = 175

        # -----------------------------
        # Window
        # -----------------------------
        root.title("Hold Space to Read")
        root.geometry("850x600")
        root.configure(bg="#202020")

        # -----------------------------
        # Title
        # -----------------------------
        title = tk.Label(
            root,
            text="Hold SPACE to Read",
            font=("Arial", 22, "bold"),
            fg="white",
            bg="#202020"
        )
        title.pack(pady=(15, 5))

        subtitle = tk.Label(
            root,
            text="Release SPACE to pause • Hold again to continue",
            font=("Arial", 11),
            fg="#aaaaaa",
            bg="#202020"
        )
        subtitle.pack(pady=(0, 10))

        # -----------------------------
        # Text box
        # -----------------------------
        self.textbox = scrolledtext.ScrolledText(
            root,
            wrap=tk.WORD,
            font=("Arial", 15),
            bg="#303030",
            fg="white",
            insertbackground="white",
            selectbackground="#555555",
            padx=15,
            pady=15
        )

        self.textbox.pack(
            fill=tk.BOTH,
            expand=True,
            padx=20,
            pady=10
        )

        # -----------------------------
        # Speed controls
        # -----------------------------
        speed_frame = tk.Frame(
            root,
            bg="#202020"
        )
        speed_frame.pack(pady=5)

        speed_label = tk.Label(
            speed_frame,
            text="Speed:",
            font=("Arial", 11, "bold"),
            fg="white",
            bg="#202020"
        )
        speed_label.pack(side=tk.LEFT, padx=5)

        self.slow_button = tk.Button(
            speed_frame,
            text="🐢 Slow",
            command=lambda: self.set_speed(120),
            width=10,
            bg="#3a3a3a",
            fg="white",
            activebackground="#555555",
            activeforeground="white"
        )
        self.slow_button.pack(side=tk.LEFT, padx=3)

        self.normal_button = tk.Button(
            speed_frame,
            text="▶ Normal",
            command=lambda: self.set_speed(175),
            width=10,
            bg="#3a3a3a",
            fg="white",
            activebackground="#555555",
            activeforeground="white"
        )
        self.normal_button.pack(side=tk.LEFT, padx=3)

        self.fast_button = tk.Button(
            speed_frame,
            text="🐇 Fast",
            command=lambda: self.set_speed(240),
            width=10,
            bg="#3a3a3a",
            fg="white",
            activebackground="#555555",
            activeforeground="white"
        )
        self.fast_button.pack(side=tk.LEFT, padx=3)

        # -----------------------------
        # Status
        # -----------------------------
        self.status = tk.Label(
            root,
            text="Enter text and hold SPACE",
            font=("Arial", 11),
            fg="#00cc66",
            bg="#202020"
        )
        self.status.pack(pady=(5, 15))

        # -----------------------------
        # Keyboard events
        # -----------------------------
        root.bind("<KeyPress-space>", self.space_pressed)
        root.bind("<KeyRelease-space>", self.space_released)

        # Make sure window receives keyboard input
        root.focus_force()

        # Set initial button state
        self.update_speed_buttons()

    # =========================================================
    # SPEED
    # =========================================================

    def set_speed(self, speed):
        self.speech_rate = speed
        self.update_speed_buttons()

        names = {
            120: "Slow",
            175: "Normal",
            240: "Fast"
        }

        self.status.config(
            text=f"Speed: {names.get(speed, speed)}"
        )

    def update_speed_buttons(self):
        buttons = {
            120: self.slow_button,
            175: self.normal_button,
            240: self.fast_button
        }

        for speed, button in buttons.items():
            if speed == self.speech_rate:
                button.config(
                    bg="#007acc",
                    activebackground="#007acc"
                )
            else:
                button.config(
                    bg="#3a3a3a",
                    activebackground="#555555"
                )

    # =========================================================
    # SPACE PRESSED
    # =========================================================

    def space_pressed(self, event=None):
        # Ignore repeated keypress events while holding Space
        if self.space_down:
            return

        self.space_down = True

        # If already reading, don't start another thread
        if self.reading:
            return

        text = self.textbox.get("1.0", tk.END).strip()

        if not text:
            self.status.config(
                text="⚠ Enter some text first!"
            )
            return

        # If text has changed, start from beginning
        if text != self.text:
            self.text = text
            self.position = 0

        self.stop_requested = False
        self.reading = True

        self.status.config(
            text="🔊 READING — release SPACE to stop"
        )

        threading.Thread(
            target=self.speak,
            daemon=True
        ).start()

    # =========================================================
    # SPACE RELEASED
    # =========================================================

    def space_released(self, event=None):
        self.space_down = False

        if not self.reading:
            return

        # Tell speech thread to stop
        self.stop_requested = True

        # IMPORTANT:
        # Immediately stop the pyttsx3 engine
        with self.engine_lock:
            if self.engine is not None:
                try:
                    self.engine.stop()
                except Exception:
                    pass

        self.status.config(
            text="⏸ PAUSED — hold SPACE to continue"
        )

    # =========================================================
    # SPEECH
    # =========================================================

    def speak(self):
        engine = pyttsx3.init()

        with self.engine_lock:
            self.engine = engine

        engine.setProperty(
            "rate",
            self.speech_rate
        )

        engine.setProperty(
            "volume",
            1.0
        )

        # ---------------------------------------------
        # Track the current word
        # ---------------------------------------------
        def on_word(name, location, length):
            if not self.stop_requested:
                self.position = self.position + location

        try:
            engine.connect(
                "started-word",
                on_word
            )
        except Exception:
            pass

        # Get text from current position
        start = self.position

        remaining = self.text[start:]

        if not remaining.strip():
            self.position = 0
            self.reading = False

            with self.engine_lock:
                self.engine = None

            self.root.after(
                0,
                lambda: self.status.config(
                    text="✅ Finished — hold SPACE to read again"
                )
            )
            return

        try:
            engine.say(remaining)
            engine.runAndWait()

        except Exception as e:
            print("Speech error:", e)

        finally:
            try:
                engine.stop()
            except Exception:
                pass

        # ---------------------------------------------
        # If Space was released
        # ---------------------------------------------
        if self.stop_requested:
            self.reading = False

            with self.engine_lock:
                self.engine = None

            return

        # ---------------------------------------------
        # Finished naturally
        # ---------------------------------------------
        self.position = 0
        self.reading = False

        with self.engine_lock:
            self.engine = None

        self.root.after(
            0,
            lambda: self.status.config(
                text="✅ Finished — hold SPACE to read again"
            )
        )


# =============================================================
# START
# =============================================================

if __name__ == "__main__":
    root = tk.Tk()

    app = TextReader(root)

    root.mainloop()