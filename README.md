# Rocket-Equations
Doing some math and some code for calculating Lunar payloads for the HLS Starship

$\Delta v = v_e \ln\!\left(\frac{m_0}{m_f}\right)$

where
- $\Delta v$ is the total velocity change required for a burn,
- $v_e$ is the effective exhaust velocity of the engine,
[
m_0
]

is the mass before the burn, and

[
m_f
]

is the mass after the burn.

If the mission requirement and engine are fixed, then this can be rearranged as

[
m_0 = m_f , e^{\Delta v / v_e}
]

where the exponential factor

[
e^{\Delta v / v_e}
]

is just a constant for that mission and engine.

That means the starting mass is proportional to the ending mass.

A clean version of your setup

There are two Earth-to-moon missions. I will call them mission 1 and mission 2.

For mission 1, let

[
M_{0,1}
]

be the mass of the vehicle before the Earth-to-moon propulsion is used, and let

[
L_1
]

be the total mass that arrives at the moon surface.

For mission 2, let

[
M_{0,2}
]

be the corresponding starting mass, and let

[
L_2
]

be the total mass that arrives at the moon surface.

Now break each moon-landed mass into pieces:

[
L_1 = P_1 + R_1 + S_1
]

[
L_2 = P_2 + R_2 + S_2
]

where

[
P_1,; P_2
]

are the useful payloads left on the moon,

[
R_1,; R_2
]

are the return rockets carried to the moon, including their fuel,

and

[
S_1,; S_2
]

are the other non-payload parts needed for landing on the moon, such as structure, tanks, legs, engines, and similar hardware.

Now describe the return rockets.

For mission 1,

[
R_1 = F_1 + E_1
]

For mission 2,

[
R_2 = F_2 + E_2
]

where

[
F_1,; F_2
]

are the return-fuel masses, and

[
E_1,; E_2
]

are the dry masses of the Earth-return vehicles after their return fuel is spent.

Now break those dry return vehicles apart:

[
E_1 = P_3 + S_{E,1}
]

[
E_2 = P_4 + S_{E,2}
]

where

[
P_3,; P_4
]

are the useful payloads returned to Earth, and

[
S_{E,1},; S_{E,2}
]

are the non-payload parts required for safe return to Earth.

What the rocket equation says here

For the Earth-to-moon part of the trip, suppose both missions use the same engine performance and require the same total

[
\Delta v
]

Then

[
M_{0,1} = k L_1
]

[
M_{0,2} = k L_2
]

where

[
k = e^{\Delta v / v_e}
]

is the same constant for both missions.

So if

[
L_1 = 2L_2
]

then automatically

[
M_{0,1} = 2M_{0,2}
]

This is the cleanest first conclusion.

If the moon-landed mass doubles, then the required starting mass also doubles, assuming the same propulsion performance and same mission profile.

What happens to the useful moon payloads (P_1) and (P_2)

From

[
L_1 = P_1 + R_1 + S_1
]

we get

[
P_1 = L_1 - R_1 - S_1
]

and from

[
L_2 = P_2 + R_2 + S_2
]

we get

[
P_2 = L_2 - R_2 - S_2
]

So the useful moon payload is the total landed mass minus everything that is not useful moon payload.

Case 1: if

[
L_1 = 2L_2
]

then

[
P_1 = 2L_2 - R_1 - S_1
]

[
P_2 = L_2 - R_2 - S_2
]

This does not by itself tell us that

[
P_1 = 2P_2
]

because that depends on how the non-payload masses compare.

There are three important possibilities.

First possibility: everything scales proportionally

If

[
R_1 = 2R_2
\quad \text{and} \quad
S_1 = 2S_2
]

then

[
P_1 = 2P_2
]

So in that very simple case, doubling total landed mass doubles useful moon payload.

Second possibility: the non-payload masses stay about the same

If

[
R_1 \approx R_2
\quad \text{and} \quad
S_1 \approx S_2
]

then

[
P_1 - P_2 \approx L_1 - L_2
]

and with

[
L_1 = 2L_2
]

the larger mission can give much more than double the useful moon payload.

This is often the most important intuition. Fixed hardware hurts small missions more than large ones.

Third possibility: the larger system needs extra supporting mass

If the larger landed system requires stronger structure, larger tanks, or a larger return system, then

[
R_1 + S_1
]

may grow faster than expected, and then

[
P_1
]

increases by less than you hoped.

So the correct statement is:

Doubling the total mass landed on the moon doubles the required starting mass, but it does not determine the useful moon payload until you specify how much of the landed mass is payload versus required hardware.

A very simple payload model

To make the math clearer, define one combined non-payload mass:

[
N_1 = R_1 + S_1
]

[
N_2 = R_2 + S_2
]

Then

[
P_1 = L_1 - N_1
]

[
P_2 = L_2 - N_2
]

Now the comparison becomes easy.

If

[
L_1 = 2L_2
]

then

[
P_1 = 2L_2 - N_1
]

[
P_2 = L_2 - N_2
]

Subtracting,

[
P_1 - 2P_2 = 2L_2 - N_1 - 2(L_2 - N_2)
]

so

[
P_1 - 2P_2 = 2N_2 - N_1
]

This tells you exactly when the bigger mission is better than double in payload.

If

[
N_1 < 2N_2
]

then

[
P_1 > 2P_2
]

If

[
N_1 = 2N_2
]

then

[
P_1 = 2P_2
]

If

[
N_1 > 2N_2
]

then

[
P_1 < 2P_2
]

So that is the clean answer to your first question.

If the total moon-landed mass doubles, the useful moon payload more than doubles, exactly doubles, or less than doubles depending on whether the non-payload mass scales sublinearly, linearly, or superlinearly.

Case 2: if (L_1) is one pound heavier than (L_2)

Now suppose

[
L
