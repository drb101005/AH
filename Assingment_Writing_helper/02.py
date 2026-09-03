import tkinter as tk
from tkinter import scrolledtext
import pyttsx3
import threading
import time


class TextReader:
    def __init__(self, root):
        self.root = root

        # =====================================================
        # STATE
        # =====================================================

        self.text = ""
        self.position = 0

        self.reading = False
        self.space_down = False
        self.stop_requested = False

        self.engine = None
        self.engine_lock = threading.Lock()

        self.speech_rate = 80

        # =====================================================
        # WINDOW
        # =====================================================

        root.title("Hold Space to Read")
        root.geometry("850x600")
        root.configure(bg="#202020")

        # =====================================================
        # TITLE
        # =====================================================

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
            text="Hold SPACE = Read   •   Release SPACE = Stop",
            font=("Arial", 11),
            fg="#aaaaaa",
            bg="#202020"
        )
        subtitle.pack(pady=(0, 10))

        # =====================================================
        # TEXT BOX
        # =====================================================

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

        # =====================================================
        # SPEED CONTROLLER
        # =====================================================

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

        # Slow
        self.slow_button = tk.Button(
            speed_frame,
            text="🐢 Slow",
            command=lambda: self.set_speed(120),
            width=10,
            bg="#3a3a3a",
            fg="white",
            activebackground="#555555",
            activeforeground="white",
            relief=tk.FLAT,
            font=("Arial", 10, "bold")
        )
        self.slow_button.pack(side=tk.LEFT, padx=3)

        # Normal
        self.normal_button = tk.Button(
            speed_frame,
            text="▶ Normal",
            command=lambda: self.set_speed(175),
            width=10,
            bg="#007acc",
            fg="white",
            activebackground="#007acc",
            activeforeground="white",
            relief=tk.FLAT,
            font=("Arial", 10, "bold")
        )
        self.normal_button.pack(side=tk.LEFT, padx=3)

        # Fast
        self.fast_button = tk.Button(
            speed_frame,
            text="🐇 Fast",
            command=lambda: self.set_speed(240),
            width=10,
            bg="#3a3a3a",
            fg="white",
            activebackground="#555555",
            activeforeground="white",
            relief=tk.FLAT,
            font=("Arial", 10, "bold")
        )
        self.fast_button.pack(side=tk.LEFT, padx=3)

        # =====================================================
        # STATUS
        # =====================================================

        self.status = tk.Label(
            root,
            text="Enter text and hold SPACE",
            font=("Arial", 11),
            fg="#00cc66",
            bg="#202020"
        )
        self.status.pack(pady=(5, 15))

        # =====================================================
        # KEYBOARD EVENTS
        # =====================================================

        root.bind("<KeyPress-space>", self.space_pressed)
        root.bind("<KeyRelease-space>", self.space_released)

        # Prevent focus problems
        root.focus_force()

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

        # Ignore repeated keypress events
        if self.space_down:
            return

        self.space_down = True

        # If already reading, don't start another thread
        if self.reading:
            return

        # Get current text
        text = self.textbox.get("1.0", tk.END).strip()

        if not text:
            self.status.config(
                text="⚠ Enter some text first!"
            )

            self.space_down = False
            return

        # -----------------------------------------------------
        # If user changed the text, restart from beginning
        # -----------------------------------------------------

        if text != self.text:
            self.text = text
            self.position = 0

        # -----------------------------------------------------
        # Start reading
        # -----------------------------------------------------

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

        # Tell speech thread to stop
        self.stop_requested = True

        # -----------------------------------------------------
        # THIS IS THE IMPORTANT PART
        # -----------------------------------------------------
        # Immediately stop pyttsx3
        # -----------------------------------------------------

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

        engine = None

        try:

            # -------------------------------------------------
            # Create speech engine
            # -------------------------------------------------

            engine = pyttsx3.init()

            with self.engine_lock:
                self.engine = engine

            # -------------------------------------------------
            # Set speed
            # -------------------------------------------------

            engine.setProperty(
                "rate",
                self.speech_rate
            )

            engine.setProperty(
                "volume",
                1.0
            )

            # -------------------------------------------------
            # Current reading position
            # -------------------------------------------------

            start_position = self.position

            remaining = self.text[start_position:]

            if not remaining.strip():

                self.position = 0
                self.reading = False

                self.root.after(
                    0,
                    lambda: self.status.config(
                        text="✅ Finished — hold SPACE to read again"
                    )
                )

                return

            # -------------------------------------------------
            # Track speech position
            # -------------------------------------------------

            current_position = start_position

            def on_word(name, location, length):

                nonlocal current_position

                # Don't update position after stop
                if self.stop_requested:
                    return

                # pyttsx3 location is relative to "remaining"
                current_position = start_position + location

                self.position = current_position

            try:
                engine.connect(
                    "started-word",
                    on_word
                )
            except Exception:
                pass

            # -------------------------------------------------
            # Speak
            # -------------------------------------------------

            engine.say(remaining)

            engine.runAndWait()

            # -------------------------------------------------
            # If SPACE was released
            # -------------------------------------------------

            if self.stop_requested:

                self.reading = False

                return

            # -------------------------------------------------
            # Finished normally
            # -------------------------------------------------

            self.position = 0
            self.reading = False

            self.root.after(
                0,
                lambda: self.status.config(
                    text="✅ Finished — hold SPACE to read again"
                )
            )

        except Exception as e:

            print("Speech error:", e)

            self.reading = False

            self.root.after(
                0,
                lambda: self.status.config(
                    text="⚠ Speech error"
                )
            )

        finally:

            # -------------------------------------------------
            # Always stop and release engine
            # -------------------------------------------------

            if engine is not None:

                try:
                    engine.stop()
                except Exception:
                    pass

            with self.engine_lock:

                if self.engine is engine:
                    self.engine = None


# =============================================================
# START PROGRAM
# =============================================================

if __name__ == "__main__":

    root = tk.Tk()

    app = TextReader(root)

    root.mainloop()