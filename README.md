# Moon payload reasoning with the rocket equation

## 1. The rocket equation

The basic rocket equation is:

$$
\Delta v = v_e \ln\left(\frac{m_0}{m_f}\right)
$$

where:
- $\Delta v$ is the required change in velocity for the burn
- $v_e$ is the effective exhaust velocity
- $m_0$ is the mass before the burn
- $m_f$ is the mass after the burn

If the engine and mission are fixed, this can be rewritten as:

$$
m_0 = m_f e^{\Delta v / v_e}
$$

where:
- $e^{\Delta v / v_e}$ is a constant for that mission and engine combination

This is the main mathematical idea.

For a fixed mission and a fixed engine,

$$
m_0 \propto m_f
$$

That means the starting mass is proportional to the final mass.

---

## 2. A clear version of the setup

Consider two Earth-to-moon missions, mission 1 and mission 2.

For mission 1:
- $M_{0,1}$ is the starting mass before the Earth-to-moon burn
- $L_1$ is the total mass landed on the moon

For mission 2:
- $M_{0,2}$ is the starting mass before the Earth-to-moon burn
- $L_2$ is the total mass landed on the moon

Now break each moon-landed mass into parts:

$$
L_1 = P_1 + R_1 + S_1
$$

$$
L_2 = P_2 + R_2 + S_2
$$

where:
- $P_1, P_2$ are the useful payloads left on the moon
- $R_1, R_2$ are the return rockets carried to the moon, including their fuel
- $S_1, S_2$ are the other moon-landing hardware masses, such as structure, tanks, engines, and landing legs

So $L_1$ and $L_2$ are not just useful equipment. They include:
- useful payload left on the moon
- the return system
- other hardware needed to land on the moon

---

## 3. The return rockets

Now define the return systems more carefully.

$$
R_1 = F_1 + E_1
$$

$$
R_2 = F_2 + E_2
$$

where:
- $F_1, F_2$ are the fuel masses needed for the return trip
- $E_1, E_2$ are the dry masses of the return vehicles after that fuel is spent

Now break the dry return vehicles apart:

$$
E_1 = P_3 + S_{E,1}
$$

$$
E_2 = P_4 + S_{E,2}
$$

where:
- $P_3, P_4$ are the useful payloads returned to Earth
- $S_{E,1}, S_{E,2}$ are the non-payload parts needed for safe Earth return

So the return payload is nested inside the return vehicle, and the return vehicle is nested inside the moon-landed mass.

---

## 4. What the rocket equation says about getting mass to the moon

Assume both missions:
- use the same engine
- require the same total $\Delta v$
- follow the same Earth-to-moon mission profile

Then the rocket equation implies:

$$
M_{0,1} = kL_1
$$

$$
M_{0,2} = kL_2
$$

where:

$$
k = e^{\Delta v / v_e}
$$

Since $k$ is the same for both missions, we also have:

$$
\frac{M_{0,1}}{M_{0,2}} = \frac{L_1}{L_2}
$$

This means:

- if the landed mass doubles, the required starting mass also doubles
- if the landed mass increases by 1 pound, the required starting mass increases by $k$ pounds

This is the cleanest consequence of the rocket equation in this simplified model.

---

## 5. Useful moon payload versus total moon-landed mass

From the definitions above,

$$
P_1 = L_1 - R_1 - S_1
$$

$$
P_2 = L_2 - R_2 - S_2
$$

It is helpful to combine the non-payload moon-landed mass into one term:

$$
N_1 = R_1 + S_1
$$

$$
N_2 = R_2 + S_2
$$

where:
- $N_1, N_2$ are the total non-payload masses that still must be landed on the moon

Then the useful moon payloads are:

$$
P_1 = L_1 - N_1
$$

$$
P_2 = L_2 - N_2
$$

This is important.

The rocket equation tells you how total mass scales.  
These equations tell you how much of that total landed mass is actually useful payload.

---

## 6. Case 1: if $L_1 = 2L_2$

Suppose mission 1 lands twice as much total mass on the moon as mission 2:

$$
L_1 = 2L_2
$$

Then from the rocket equation:

$$
M_{0,1} = 2M_{0,2}
$$

So the required starting mass also doubles.

Now look at useful moon payload.

Using

$$
P_1 = L_1 - N_1
$$

$$
P_2 = L_2 - N_2
$$

and substituting $L_1 = 2L_2$, we get:

$$
P_1 = 2L_2 - N_1
$$

$$
P_2 = L_2 - N_2
$$

To compare $P_1$ with $2P_2$, first compute:

$$
2P_2 = 2L_2 - 2N_2
$$

Then subtract:

$$
P_1 - 2P_2 = (2L_2 - N_1) - (2L_2 - 2N_2)
$$

which simplifies to:

$$
P_1 - 2P_2 = 2N_2 - N_1
$$

This is the key result for the doubled-mass case.

### Interpretation

If

$$
N_1 < 2N_2
$$

then

$$
P_1 > 2P_2
$$

If

$$
N_1 = 2N_2
$$

then

$$
P_1 = 2P_2
$$

If

$$
N_1 > 2N_2
$$

then

$$
P_1 < 2P_2
$$

So the correct conclusion is:

If one mission lands twice as much total mass on the moon, its useful moon payload may be:
- more than double
- exactly double
- less than double

depending on how the non-payload mass scales.

### Intuition

If the required hardware does not double exactly, then a larger mission can be more efficient.

For example, some structure, avionics, or landing hardware may not need to grow in perfect proportion to total landed mass. In that case, a larger mission can devote a greater fraction of its landed mass to useful moon payload.

---

## 7. Case 2: if $L_1 = L_2 + 1$

Now suppose mission 1 lands just 1 pound more on the moon than mission 2:

$$
L_1 = L_2 + 1
$$

From the rocket equation,

$$
M_{0,1} = kL_1
$$

$$
M_{0,2} = kL_2
$$

Subtracting gives:

$$
M_{0,1} - M_{0,2} = k(L_1 - L_2)
$$

Since $L_1 - L_2 = 1$, this becomes:

$$
M_{0,1} - M_{0,2} = k
$$

So an extra 1 pound landed on the moon requires an extra $k$ pounds at the start of the Earth-to-moon mission.

Now look at useful moon payload.

Using

$$
P_1 = L_1 - N_1
$$

$$
P_2 = L_2 - N_2
$$

and substituting $L_1 = L_2 + 1$, we get:

$$
P_1 = L_2 + 1 - N_1
$$

$$
P_2 = L_2 - N_2
$$

Subtracting:

$$
P_1 - P_2 = (L_2 + 1 - N_1) - (L_2 - N_2)
$$

which simplifies to:

$$
P_1 - P_2 = 1 + N_2 - N_1
$$

This is the key result for the 1-pound-heavier case.

### Interpretation

If

$$
N_1 = N_2
$$

then

$$
P_1 - P_2 = 1
$$

So if the non-payload hardware does not change, then 1 extra pound landed on the moon gives 1 extra pound of useful moon payload.

If

$$
N_1 > N_2
$$

then some of that extra landed mass is consumed by extra hardware, so the useful moon payload increases by less than 1 pound.

If

$$
N_1 < N_2
$$

then the heavier mission is more efficient, and the useful moon payload increases by more than 1 pound.

---

## 8. Why return payload is expensive

The payload returned to Earth appears inside the return vehicle:

$$
E_1 = P_3 + S_{E,1}
$$

and the return vehicle appears inside the moon-landed mass:

$$
L_1 = P_1 + R_1 + S_1
$$

with

$$
R_1 = F_1 + E_1
$$

So increasing $P_3$ increases $E_1$, which increases $R_1$, which increases $L_1$, which increases $M_{0,1}$.

In plain language:

Returning useful mass to Earth makes the moon mission heavier because the return system itself must first be carried to the moon.

So return capability is costly in mass terms.

---

## 9. A rough cost model

Suppose launch costs

$$
c
$$

dollars per pound of starting mass.

Then the total launch cost for mission 1 is approximately:

$$
C_1 = cM_{0,1}
$$

Since

$$
M_{0,1} = kL_1
$$

we get:

$$
C_1 = ckL_1
$$

The cost per pound of useful moon payload is then:

$$
\frac{C_1}{P_1} = \frac{ckL_1}{P_1}
$$

Using

$$
L_1 = P_1 + N_1
$$

this becomes:

$$
\frac{C_1}{P_1} = ck\left(1 + \frac{N_1}{P_1}\right)
$$

This gives a very rough idea of cost efficiency.

The cost per pound of useful moon payload becomes worse when:
- $k$ is large
- $N_1$ is large relative to $P_1$

The cost per pound becomes better when:
- propulsion performance improves
- non-payload mass is reduced
- useful payload is large compared with required hardware

---

## 10. Final summary

### If $L_1 = 2L_2$

Then:

$$
M_{0,1} = 2M_{0,2}
$$

and

$$
P_1 - 2P_2 = 2N_2 - N_1
$$

So the useful moon payload in mission 1 may be more than double, exactly double, or less than double that of mission 2, depending on how the non-payload mass scales.

### If $L_1 = L_2 + 1$

Then:

$$
M_{0,1} - M_{0,2} = k
$$

and

$$
P_1 - P_2 = 1 + N_2 - N_1
$$

So adding 1 pound of moon-landed mass costs $k$ pounds at the start of the mission, while the gain in useful moon payload depends on whether the non-payload hardware changes.

---

## 11. Main takeaway

The rocket equation tells you how total mass scales with mission difficulty.

But the useful design question is not just:

> How much total mass can I land on the moon?

It is:

> Of the mass landed on the moon, how much is actually useful payload, and how much is required hardware?

That is the core tradeoff.
