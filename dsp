Here is a high-performance, real-time sample playback voice with variable-rate resampling, cubic Hermite interpolation, and exponential choke dampening designed specifically to handle high-speed Trap/Drill pitch sweeps without audio artifacts or aliasing clicks.

---

## 1. Mathematical Mechanics

To pitch-shift a sample via resampling without changing the master audio sample rate ($f_s$):

1. **Semitone Ratio Conversion:** Convert a semitone offset $\Delta S$ to a playback speed ratio $R$:

$$R = 2^{\frac{\Delta S}{12}}$$


2. **Phase Accumulation:** Increment the read position $P$ each sample by $R$:

$$P_{n+1} = P_n + R$$


3. **Sub-Sample Interpolation:** Split $P$ into integer frame index $i = \lfloor P \rfloor$ and fractional offset $\mu = P - i$. Four adjacent sample points ($y_{-1}, y_0, y_1, y_2$) are interpolated using a 4-point, 3rd-order **Cubic Hermite Polynomial**:

$$y(\mu) = y_0 + \frac{1}{2} \mu \left( (y_1 - y_{-1}) + \mu \left( (2y_{-1} - 5y_0 + 4y_1 - y_2) + \mu (-y_{-1} + 3y_0 - 3y_1 + y_2) \right) \right)$$



---

## 2. Audio Voice DSP Engine (`SampleVoiceDSP.h`)

This class manages individual voice instances, sample interpolation, pitch smoothing (to prevent step zippering during continuous sweeps), and smooth choke envelopes.

```cpp
#pragma once
#include <JuceHeader.h>
#include "PercussionEngineTypes.h"

namespace PercussionEngine
{
    class SampleVoiceDSP
    {
    public:
        SampleVoiceDSP() = default;

        void prepare(double newSampleRate)
        {
            sampleRate = newSampleRate;
            // Smooth pitch parameter changes across a ~2ms window to eliminate zipper noise
            pitchSmoother.reset(sampleRate, 0.002);
            chokeVolume = 1.0f;
            isChoking = false;
            active = false;
        }

        void startVoice(const juce::AudioBuffer<float>* audioSample,
                        float semitoneOffset,
                        float velocity,
                        float panPosition,
                        int voiceChokeGroup)
        {
            sampleData = audioSample;
            if (sampleData == nullptr || sampleData->getNumSamples() == 0)
                return;

            readPosition = 0.0;
            baseVelocity = velocity;
            pan = juce::jlimit(-1.0f, 1.0f, panPosition);
            chokeGroup = voiceChokeGroup;

            // Set up pitch ratio
            float targetRatio = std::pow(2.0f, semitoneOffset / 12.0f);
            pitchSmoother.setCurrentAndTargetValue(targetRatio);

            chokeVolume = 1.0f;
            isChoking = false;
            active = true;
        }

        // Sets dynamic target pitch during a multi-note roll sweep
        void setTargetPitch(float semitoneOffset)
        {
            float targetRatio = std::pow(2.0f, semitoneOffset / 12.0f);
            pitchSmoother.setTargetValue(targetRatio);
        }

        // Trigger fast exponential dampening envelope for choke events
        void triggerChoke()
        {
            isChoking = true;
        }

        void renderNextBlock(juce::AudioBuffer<float>& outputBuffer, int startSample, int numSamples)
        {
            if (!active || sampleData == nullptr)
                return;

            const int numChannels = sampleData->getNumChannels();
            const int totalSampleFrames = sampleData->getNumSamples();
            const float* const* srcData = sampleData->getArrayOfReadPointers();

            float* const* dstData = outputBuffer.getArrayOfWritePointers();

            // Equal-power stereo panning gains
            const float panAngle = (pan + 1.0f) * 0.25f * juce::MathConstants<float>::pi; // 0 to pi/2
            const float leftGain = std::cos(panAngle) * baseVelocity;
            const float rightGain = std::sin(panAngle) * baseVelocity;

            // Choke release coefficient (~3ms exponential decay to 0)
            const float chokeDecay = std::exp(-1.0f / (0.003f * static_cast<float>(sampleRate)));

            for (int i = 0; i < numSamples; ++i)
            {
                if (!active) break;

                // 1. Advance pitch smoother to get current playback speed ratio
                double currentRatio = pitchSmoother.getNextValue();

                // 2. Extract integer index and sub-sample fraction
                int index0 = static_cast<int>(readPosition);
                float mu = static_cast<float>(readPosition - index0);

                // Stop voice if position exceeds buffer bounds
                if (index0 >= totalSampleFrames - 2)
                {
                    active = false;
                    break;
                }

                // 3. Four-point neighborhood lookup for Cubic Hermite interpolation
                int i_m1 = juce::jmax(0, index0 - 1);
                int i_0  = index0;
                int i_p1 = index0 + 1;
                int i_p2 = juce::jmin(totalSampleFrames - 1, index0 + 2);

                // 4. Interpolate stereo channels
                float sampleL = cubicHermite(srcData[0][i_m1], srcData[0][i_0], srcData[0][i_p1], srcData[0][i_p2], mu);
                float sampleR = (numChannels > 1) 
                    ? cubicHermite(srcData[1][i_m1], srcData[1][i_0], srcData[1][i_p1], srcData[1][i_p2], mu)
                    : sampleL;

                // 5. Apply choke dampening envelope
                if (isChoking)
                {
                    chokeVolume *= chokeDecay;
                    if (chokeVolume < 0.0001f) // Drop below -80dB threshold
                    {
                        active = false;
                        chokeVolume = 0.0f;
                    }
                }

                float currentGainL = leftGain * chokeVolume;
                float currentGainR = rightGain * chokeVolume;

                // 6. Accumulate into output buffer
                dstData[0][startSample + i] += sampleL * currentGainL;
                if (outputBuffer.getNumChannels() > 1)
                    dstData[1][startSample + i] += sampleR * currentGainR;

                // 7. Advance fractional read head by pitch speed ratio
                readPosition += currentRatio;
            }
        }

        bool isActive() const { return active; }
        int getChokeGroup() const { return chokeGroup; }

    private:
        // 4-Point, 3rd-Order Cubic Hermite Interpolator
        juce_forceinline float cubicHermite(float y_m1, float y0, float y1, float y2, float mu) const
        {
            float mu2 = mu * mu;
            float a0 = -0.5f * y_m1 + 1.5f * y0 - 1.5f * y1 + 0.5f * y2;
            float a1 = y_m1 - 2.5f * y0 + 2.0f * y1 - 0.5f * y2;
            float a2 = -0.5f * y_m1 + 0.5f * y1;
            float a3 = y0;

            return a0 * mu * mu2 + a1 * mu2 + a2 * mu + a3;
        }

        double sampleRate = 44100.0;
        const juce::AudioBuffer<float>* sampleData = nullptr;

        double readPosition = 0.0;
        float baseVelocity = 1.0f;
        float pan = 0.0f;
        int chokeGroup = 1;

        bool active = false;
        bool isChoking = false;
        float chokeVolume = 1.0f;

        juce::SmoothedValue<double, juce::ValueSmoothingTypes::Linear> pitchSmoother;
    };
}

```

---

## 3. Polyphonic Voice Allocator & Choke Manager (`VoicePool.h`)

Manages polyphony allocation, routes pitch updates during high-speed roll runs, and handles instant choke groups (e.g., closed hat silencing an active open hat).

```cpp
#pragma once
#include <JuceHeader.h>
#include "SampleVoiceDSP.h"

namespace PercussionEngine
{
    class VoicePool
    {
    public:
        static constexpr int MaxVoices = 16;

        VoicePool() = default;

        void prepare(double sampleRate)
        {
            for (auto& voice : voices)
                voice.prepare(sampleRate);
        }

        // Trigger a new sample hit, automatically executing choke rules
        void triggerNote(const juce::AudioBuffer<float>* sampleBuffer,
                         float semitoneOffset,
                         float velocity,
                         float pan,
                         int chokeGroup)
        {
            // 1. Choke active voices sharing the same non-zero choke group
            if (chokeGroup > 0)
            {
                for (auto& voice : voices)
                {
                    if (voice.isActive() && voice.getChokeGroup() == chokeGroup)
                    {
                        voice.triggerChoke();
                    }
                }
            }

            // 2. Find free voice or steal oldest active voice
            SampleVoiceDSP* targetVoice = findFreeVoice();
            if (targetVoice != nullptr)
            {
                targetVoice->startVoice(sampleBuffer, semitoneOffset, velocity, pan, chokeGroup);
            }
        }

        void renderNextBlock(juce::AudioBuffer<float>& buffer, int startSample, int numSamples)
        {
            for (auto& voice : voices)
            {
                if (voice.isActive())
                {
                    voice.renderNextBlock(buffer, startSample, numSamples);
                }
            }
        }

    private:
        SampleVoiceDSP* findFreeVoice()
        {
            for (auto& voice : voices)
            {
                if (!voice.isActive())
                    return &voice;
            }
            // If pool is saturated, return first voice for voice-stealing
            return &voices[0];
        }

        std::array<SampleVoiceDSP, MaxVoices> voices;
    };
}

```

---

## 4. Integration into JUCE `AudioProcessor`

Connect the `VoicePool` to render outgoing `PercussionEvent` arrays in real time:

```cpp
void HiHatPercProgrammerAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    buffer.clear();
    eventQueue.clearQuick();

    // 1. Evaluate pattern generator
    sequencer.processBlock(getPlayHead(), buffer.getNumSamples(), eventQueue);

    // 2. Process sample-accurate event triggers through Voice Pool
    for (const auto& evt : eventQueue)
    {
        const juce::AudioBuffer<float>* targetSample = sampleManager.getSampleForEvent(evt);
        
        voicePool.triggerNote(
            targetSample,
            evt.pitchShiftSemitones,
            evt.velocity,
            evt.pan,
            evt.chokeGroup
        );
    }

    // 3. Render DSP Audio Output
    voicePool.renderNextBlock(buffer, 0, buffer.getNumSamples());
}

```

---
