"""
A simple 2D Earth-Moon rocket simulation using VPython.

What it does
------------
- Draws Earth, Moon, and a rocket
- Simulates gravity from Earth and Moon
- Launches a rocket from low Earth orbit / near-Earth start position
- Lets you adjust launch speed and angle
- Leaves a trail so you can see the trajectory

How to run
----------
1. Install VPython:
   pip install vpython

2. Run:
   python earth_moon_launch_sim.py

Notes
-----
- This is a teaching toy, not a mission-grade integrator.
- The Moon is treated as moving in a circular orbit around Earth.
- The rocket does not thrust after launch; it is a ballistic trajectory after the initial velocity is set.
- Distances are in meters, time in seconds, mass in kilograms.
"""

from vpython import (
    canvas,
    sphere,
    vector,
    color,
    rate,
    label,
    wtext,
    button,
    slider,
    checkbox,
    curve,
    mag,
    norm,
)
import math

# ----------------------------
# Physical constants
# ----------------------------
G = 6.67430e-11

M_EARTH = 5.972e24
R_EARTH = 6.371e6

M_MOON = 7.34767309e22
R_MOON = 1.7374e6

EARTH_MOON_DISTANCE = 384_400_000.0
MOON_ORBIT_PERIOD = 27.321661 * 24 * 3600
MOON_ANGULAR_SPEED = 2 * math.pi / MOON_ORBIT_PERIOD

# ----------------------------
# Display scaling
# ----------------------------
# Radii are exaggerated so the objects are visible.
EARTH_DRAW_RADIUS = R_EARTH * 30
MOON_DRAW_RADIUS = R_MOON * 70
ROCKET_DRAW_RADIUS = R_EARTH * 8

# ----------------------------
# Default launch settings
# ----------------------------
DEFAULT_ALTITUDE = 300_000.0  # 300 km above Earth surface
DEFAULT_SPEED = 10_900.0  # m/s, try 10800-11200
DEFAULT_ANGLE_DEG = 25.0  # angle relative to local tangential direction
DEFAULT_DT = 20.0  # seconds per integration step

# ----------------------------
# Scene
# ----------------------------
scene = canvas(
    title="Earth-Moon Launch Simulation\n",
    width=1200,
    height=760,
    background=vector(0.03, 0.03, 0.06),
)
scene.append_to_caption("\nControls:\n")

# ----------------------------
# UI state
# ----------------------------
running = False
show_vectors = False
show_trail = True

speed_value = DEFAULT_SPEED
angle_value = DEFAULT_ANGLE_DEG
dt_value = DEFAULT_DT

status_text = wtext(text="\nReady.\n")

scene.append_to_caption("\nLaunch speed (m/s): ")
speed_readout = wtext(text=f"{speed_value:,.0f}")
scene.append_to_caption("\n")
speed_slider = slider(
    min=9000, max=12000, value=speed_value, step=50, bind=None, length=300
)

scene.append_to_caption("\nLaunch angle from local tangent (deg): ")
angle_readout = wtext(text=f"{angle_value:.1f}")
scene.append_to_caption("\n")
angle_slider = slider(min=-90, max=90, value=angle_value, step=1, bind=None, length=300)

scene.append_to_caption("\nTime step dt (s): ")
dt_readout = wtext(text=f"{dt_value:.1f}")
scene.append_to_caption("\n")
dt_slider = slider(min=2, max=200, value=dt_value, step=1, bind=None, length=300)

scene.append_to_caption("\n")
trail_checkbox = checkbox(text=" Show trail", checked=True, bind=None)
scene.append_to_caption("   ")
vector_checkbox = checkbox(
    text=" Show velocity/acceleration vectors", checked=False, bind=None
)
scene.append_to_caption("\n\n")

# ----------------------------
# Bodies and helpers
# ----------------------------
earth = sphere(
    pos=vector(0, 0, 0),
    radius=EARTH_DRAW_RADIUS,
    color=color.blue,
    emissive=False,
)

moon = sphere(
    pos=vector(EARTH_MOON_DISTANCE, 0, 0),
    radius=MOON_DRAW_RADIUS,
    color=color.white,
    emissive=False,
)

rocket = sphere(
    pos=vector(0, R_EARTH + DEFAULT_ALTITUDE, 0),
    radius=ROCKET_DRAW_RADIUS,
    color=color.red,
    make_trail=True,
    retain=8000,
    interval=1,
)

rocket.velocity = vector(0, 0, 0)
rocket.acceleration = vector(0, 0, 0)

velocity_arrow = curve(color=color.cyan, radius=R_EARTH * 1.5)
accel_arrow = curve(color=color.yellow, radius=R_EARTH * 1.5)

moon_orbit_path = curve(color=vector(0.25, 0.25, 0.35), radius=R_EARTH * 0.4)
for i in range(361):
    theta = 2 * math.pi * i / 360
    moon_orbit_path.append(
        pos=vector(
            EARTH_MOON_DISTANCE * math.cos(theta),
            EARTH_MOON_DISTANCE * math.sin(theta),
            0,
        )
    )

info = label(
    pos=vector(0, -EARTH_MOON_DISTANCE * 0.14, 0),
    text="",
    box=False,
    height=14,
    color=color.white,
)

scene.center = vector(EARTH_MOON_DISTANCE * 0.35, 0, 0)
scene.range = EARTH_MOON_DISTANCE * 0.65


# ----------------------------
# Physics helpers
# ----------------------------
def moon_position(t: float) -> vector:
    theta = MOON_ANGULAR_SPEED * t
    return vector(
        EARTH_MOON_DISTANCE * math.cos(theta), EARTH_MOON_DISTANCE * math.sin(theta), 0
    )


def gravitational_acceleration(pos: vector, moon_pos: vector) -> vector:
    r_e = pos - earth.pos
    r_m = pos - moon_pos

    a_earth = -G * M_EARTH * r_e / (mag(r_e) ** 3)
    a_moon = -G * M_MOON * r_m / (mag(r_m) ** 3)

    return a_earth + a_moon


def reset_rocket():
    global sim_time, running

    sim_time = 0.0
    running = False

    altitude = DEFAULT_ALTITUDE
    rocket.pos = vector(0, R_EARTH + altitude, 0)

    radial_hat = norm(rocket.pos - earth.pos)
    tangent_hat = vector(-radial_hat.y, radial_hat.x, 0)

    angle_rad = math.radians(angle_value)
    launch_direction = (
        math.cos(angle_rad) * tangent_hat + math.sin(angle_rad) * radial_hat
    )

    rocket.velocity = speed_value * norm(launch_direction)
    rocket.acceleration = vector(0, 0, 0)

    rocket.clear_trail()
    rocket.make_trail = show_trail

    velocity_arrow.clear()
    accel_arrow.clear()

    status_text.text = "\nRocket reset.\n"


def update_ui_readouts():
    speed_readout.text = f"{speed_slider.value:,.0f}"
    angle_readout.text = f"{angle_slider.value:.1f}"
    dt_readout.text = f"{dt_slider.value:.1f}"


def pull_ui_values():
    global speed_value, angle_value, dt_value, show_trail, show_vectors
    speed_value = float(speed_slider.value)
    angle_value = float(angle_slider.value)
    dt_value = float(dt_slider.value)
    show_trail = bool(trail_checkbox.checked)
    show_vectors = bool(vector_checkbox.checked)


# ----------------------------
# Buttons
# ----------------------------
def start_pause(_):
    global running
    running = not running
    status_text.text = "\nRunning...\n" if running else "\nPaused.\n"


def reset_button(_):
    pull_ui_values()
    reset_rocket()


button(text="Start / Pause", bind=start_pause)
scene.append_to_caption("   ")
button(text="Reset with current settings", bind=reset_button)
scene.append_to_caption("\n")

# ----------------------------
# Simulation state
# ----------------------------
sim_time = 0.0
reset_rocket()

# ----------------------------
# Main loop
# ----------------------------
while True:
    rate(120)

    update_ui_readouts()

    if not running:
        pull_ui_values()
        rocket.make_trail = bool(trail_checkbox.checked)
        moon.pos = moon_position(sim_time)
        continue

    pull_ui_values()

    dt = dt_value
    moon.pos = moon_position(sim_time)

    # Semi-implicit Euler integration
    rocket.acceleration = gravitational_acceleration(rocket.pos, moon.pos)
    rocket.velocity = rocket.velocity + rocket.acceleration * dt
    rocket.pos = rocket.pos + rocket.velocity * dt

    sim_time += dt

    # Update vector visuals
    velocity_arrow.clear()
    accel_arrow.clear()
    if show_vectors:
        velocity_scale = 6000
        accel_scale = 2.5e8
        velocity_arrow.append(pos=rocket.pos)
        velocity_arrow.append(pos=rocket.pos + rocket.velocity * velocity_scale)
        accel_arrow.append(pos=rocket.pos)
        accel_arrow.append(pos=rocket.pos + rocket.acceleration * accel_scale)

    # Basic status text
    dist_earth_center = mag(rocket.pos - earth.pos)
    dist_moon_center = mag(rocket.pos - moon.pos)
    altitude_earth = dist_earth_center - R_EARTH
    altitude_moon = dist_moon_center - R_MOON
    speed_now = mag(rocket.velocity)

    info.text = (
        f"t = {sim_time / 3600:,.1f} hr\n"
        f"speed = {speed_now:,.0f} m/s\n"
        f"altitude above Earth = {altitude_earth / 1000:,.0f} km\n"
        f"altitude above Moon = {altitude_moon / 1000:,.0f} km\n"
        f"launch speed = {speed_value:,.0f} m/s\n"
        f"launch angle from local tangent = {angle_value:.1f} deg"
    )

    # Collision checks
    if dist_earth_center <= R_EARTH:
        running = False
        status_text.text = "\nRocket impacted Earth.\n"

    if dist_moon_center <= R_MOON:
        running = False
        status_text.text = "\nRocket impacted Moon.\n"
