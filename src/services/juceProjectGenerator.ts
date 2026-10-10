export interface JuceProjectFile {
  path: string;
  name: string;
  category: 'CMake' | 'Engine' | 'DSP' | 'Plugin' | 'Doc';
  content: string;
}

export function getJuceProjectFiles(): JuceProjectFile[] {
  return [
    {
      name: 'CMakeLists.txt',
      path: 'CMakeLists.txt',
      category: 'CMake',
      content: `cmake_minimum_required(VERSION 3.22)
project(HiHatPercProgrammer VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# JUCE CMake Integration
find_package(JUCE CONFIG REQUIRED)

juce_add_plugin(HiHatPercProgrammer
    COMPANY_NAME "AudioStudio"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT TRUE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    PLUGIN_MANUFACTURER_CODE AudS
    PLUGIN_CODE HhP1
    FORMATS VST3 AU Standalone
    PRODUCT_NAME "Hi-Hat Perc Programmer"
)

target_sources(HiHatPercProgrammer PRIVATE
    Source/PluginProcessor.cpp
    Source/PluginProcessor.h
    Source/PluginEditor.cpp
    Source/PluginEditor.h
    Source/Engine/PercussionEngineTypes.h
    Source/Engine/HatStateMachine.h
    Source/Engine/Humanizer.h
    Source/Engine/SequencerEngine.h
    Source/Engine/Quantizer.h
    Source/DSP/SampleVoiceDSP.h
    Source/DSP/VoicePool.h
)

target_compile_definitions(HiHatPercProgrammer PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

target_link_libraries(HiHatPercProgrammer PRIVATE
    juce::juce_audio_utils
    juce::juce_audio_processors
    juce::juce_gui_basics
    juce::juce_gui_extra
    juce::juce_dsp
)
`
    },
    {
      name: 'PercussionEngineTypes.h',
      path: 'Source/Engine/PercussionEngineTypes.h',
      category: 'Engine',
      content: `#pragma once
#include <juce_audio_basics/juce_audio_basics.h>

namespace PercussionEngine
{
    enum class RollType
    {
        None = 0,
        Straight_32nd = 1,
        Straight_64th = 2,
        Triplet_32ndT = 3,
        Triplet_64thT = 4
    };

    enum class PitchRampCurve
    {
        Linear = 0,
        Exponential = 1,
        Logarithmic = 2
    };

    struct PercussionEvent
    {
        int sampleOffset = 0;             // Sample offset within audio block
        int instrumentId = 0;             // 0: Closed Hat, 1: Open Hat, etc.
        float velocity = 0.8f;            // 0.0f to 1.0f
        float timingOffsetMs = 0.0f;      // Micro-timing offset (-20ms to +20ms)
        float hatOpenness = 0.0f;         // 0.0f (Tight) to 1.0f (Full Open)
        float pitchShiftSemitones = 0.0f; // -12.0f to +12.0f
        float pan = 0.0f;                 // -1.0f (Left) to +1.0f (Right)
        int chokeGroup = 1;               // 1 = Hi-Hat Choke Group, 0 = None
    };

    struct SequencerStep
    {
        bool active = false;
        float baseVelocity = 0.8f;
        float probability = 1.0f;
        RollType rollType = RollType::None;
        PitchRampCurve pitchCurve = PitchRampCurve::Linear;
        float startPitchOffset = 0.0f;
        float endPitchOffset = 0.0f;
        float panStart = 0.0f;
        float panEnd = 0.0f;
        float hatOpenness = 0.0f;
    };

    struct HumanizerParams
    {
        float timingJitterMs = 2.0f;
        float timingDriftMs = 4.0f;
        float velocityJitter = 0.05f;
        float swingPercent = 50.0f;
    };
}
`
    },
    {
      name: 'HatStateMachine.h',
      path: 'Source/Engine/HatStateMachine.h',
      category: 'Engine',
      content: `#pragma once
#include "PercussionEngineTypes.h"

namespace PercussionEngine
{
    enum class HatZone
    {
        TightClosed,
        LooseClosed,
        HalfOpen,
        FullOpen
    };

    class HatStateMachine
    {
    public:
        HatStateMachine() = default;

        static HatZone getZoneFromOpenness(float openness)
        {
            if (openness < 0.2f) return HatZone::TightClosed;
            if (openness < 0.5f) return HatZone::LooseClosed;
            if (openness < 0.8f) return HatZone::HalfOpen;
            return HatZone::FullOpen;
        }

        // Fast exponential dampening coefficient (<3ms decay) for choke events
        static float calculateChokeDecayRate(double sampleRate)
        {
            return static_cast<float>(std::exp(-1.0 / (0.003 * sampleRate)));
        }
    };
}
`
    },
    {
      name: 'Humanizer.h',
      path: 'Source/Engine/Humanizer.h',
      category: 'Engine',
      content: `#pragma once
#include <juce_core/juce_core.h>
#include "PercussionEngineTypes.h"

namespace PercussionEngine
{
    class Humanizer
    {
    public:
        Humanizer() { random.setSeedRandomly(); }

        float calculateTimingOffset(const HumanizerParams& params, double currentPpq)
        {
            float jitter = (random.nextFloat() * 2.0f - 1.0f) * params.timingJitterMs;
            float drift = std::sin(static_cast<float>(currentPpq * 0.25 * juce::MathConstants<double>::pi)) * params.timingDriftMs;
            return jitter + drift;
        }

        float calculateVelocityOffset(const HumanizerParams& params)
        {
            return (random.nextFloat() * 2.0f - 1.0f) * params.velocityJitter;
        }

    private:
        juce::Random random;
    };
}
`
    },
    {
      name: 'SampleVoiceDSP.h',
      path: 'Source/DSP/SampleVoiceDSP.h',
      category: 'DSP',
      content: `#pragma once
#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_dsp/juce_dsp.h>
#include "../Engine/PercussionEngineTypes.h"

namespace PercussionEngine
{
    class SampleVoiceDSP
    {
    public:
        SampleVoiceDSP() = default;

        void prepare(double newSampleRate)
        {
            sampleRate = newSampleRate;
            pitchSmoother.reset(sampleRate, 0.002);
            chokeDecay = static_cast<float>(std::exp(-1.0 / (0.003 * sampleRate)));
            active = false;
        }

        void startVoice(const juce::AudioBuffer<float>* audioSample,
                        float semitoneOffset,
                        float velocity,
                        float panPosition,
                        int voiceChokeGroup)
        {
            sampleData = audioSample;
            if (sampleData == nullptr || sampleData->getNumSamples() == 0) return;

            readPosition = 0.0;
            baseVelocity = velocity;
            pan = juce::jlimit(-1.0f, 1.0f, panPosition);
            chokeGroup = voiceChokeGroup;

            float targetRatio = std::pow(2.0f, semitoneOffset / 12.0f);
            pitchSmoother.setCurrentAndTargetValue(targetRatio);

            chokeVolume = 1.0f;
            isChoking = false;
            active = true;
        }

        void triggerChoke() { isChoking = true; }

        void renderNextBlock(juce::AudioBuffer<float>& outputBuffer, int startSample, int numSamples)
        {
            if (!active || sampleData == nullptr) return;

            const int numChannels = sampleData->getNumChannels();
            const int totalFrames = sampleData->getNumSamples();
            const float* const* srcData = sampleData->getArrayOfReadPointers();
            float* const* dstData = outputBuffer.getArrayOfWritePointers();

            const float panAngle = (pan + 1.0f) * 0.25f * juce::MathConstants<float>::pi;
            const float leftGain = std::cos(panAngle) * baseVelocity;
            const float rightGain = std::sin(panAngle) * baseVelocity;

            for (int i = 0; i < numSamples; ++i)
            {
                if (!active) break;
                double currentRatio = pitchSmoother.getNextValue();
                int idx0 = static_cast<int>(readPosition);
                float mu = static_cast<float>(readPosition - idx0);

                if (idx0 >= totalFrames - 2) { active = false; break; }

                int im1 = juce::jmax(0, idx0 - 1);
                int ip1 = idx0 + 1;
                int ip2 = juce::jmin(totalFrames - 1, idx0 + 2);

                float sampleL = cubicHermite(srcData[0][im1], srcData[0][idx0], srcData[0][ip1], srcData[0][ip2], mu);
                float sampleR = (numChannels > 1)
                    ? cubicHermite(srcData[1][im1], srcData[1][idx0], srcData[1][ip1], srcData[1][ip2], mu)
                    : sampleL;

                if (isChoking)
                {
                    chokeVolume *= chokeDecay;
                    if (chokeVolume < 0.0001f) { active = false; chokeVolume = 0.0f; }
                }

                dstData[0][startSample + i] += sampleL * leftGain * chokeVolume;
                if (outputBuffer.getNumChannels() > 1)
                    dstData[1][startSample + i] += sampleR * rightGain * chokeVolume;

                readPosition += currentRatio;
            }
        }

        bool isActive() const { return active; }
        int getChokeGroup() const { return chokeGroup; }

    private:
        juce_forceinline float cubicHermite(float ym1, float y0, float y1, float y2, float mu) const
        {
            float mu2 = mu * mu;
            float a0 = -0.5f * ym1 + 1.5f * y0 - 1.5f * y1 + 0.5f * y2;
            float a1 = ym1 - 2.5f * y0 + 2.0f * y1 - 0.5f * y2;
            float a2 = -0.5f * ym1 + 0.5f * y1;
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
        float chokeDecay = 0.99f;
        juce::SmoothedValue<double, juce::ValueSmoothingTypes::Linear> pitchSmoother;
    };
}
`
    },
    {
      name: 'VoicePool.h',
      path: 'Source/DSP/VoicePool.h',
      category: 'DSP',
      content: `#pragma once
#include "SampleVoiceDSP.h"
#include <array>

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

        void triggerNote(const juce::AudioBuffer<float>* sampleBuffer,
                         float semitoneOffset,
                         float velocity,
                         float pan,
                         int chokeGroup)
        {
            // Choke active voices in same group
            if (chokeGroup > 0)
            {
                for (auto& voice : voices)
                {
                    if (voice.isActive() && voice.getChokeGroup() == chokeGroup)
                        voice.triggerChoke();
                }
            }

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
                    voice.renderNextBlock(buffer, startSample, numSamples);
            }
        }

    private:
        SampleVoiceDSP* findFreeVoice()
        {
            for (auto& voice : voices)
                if (!voice.isActive()) return &voice;
            return &voices[0];
        }

        std::array<SampleVoiceDSP, MaxVoices> voices;
    };
}
`
    },
    {
      name: 'PluginProcessor.h',
      path: 'Source/PluginProcessor.h',
      category: 'Plugin',
      content: `#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "Engine/PercussionEngineTypes.h"
#include "DSP/VoicePool.h"

class HiHatPercProgrammerAudioProcessor : public juce::AudioProcessor
{
public:
    HiHatPercProgrammerAudioProcessor();
    ~HiHatPercProgrammerAudioProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "HiHat Perc Programmer"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return true; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return "Default"; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    PercussionEngine::VoicePool& getVoicePool() { return voicePool; }

private:
    PercussionEngine::VoicePool voicePool;
    std::array<PercussionEngine::SequencerStep, 16> pattern;
    double sampleRate = 44100.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(HiHatPercProgrammerAudioProcessor)
};
`
    },
    {
      name: 'PluginProcessor.cpp',
      path: 'Source/PluginProcessor.cpp',
      category: 'Plugin',
      content: `#include "PluginProcessor.h"
#include "PluginEditor.h"

HiHatPercProgrammerAudioProcessor::HiHatPercProgrammerAudioProcessor()
    : AudioProcessor(BusesProperties().withOutput("Output", juce::AudioChannelSet::stereo(), true))
{
    // Initialize default pattern
    for (int i = 0; i < 16; ++i)
    {
        pattern[i].active = (i % 2 == 0);
        pattern[i].baseVelocity = (i % 4 == 0) ? 0.95f : 0.65f;
    }
}

HiHatPercProgrammerAudioProcessor::~HiHatPercProgrammerAudioProcessor() = default;

void HiHatPercProgrammerAudioProcessor::prepareToPlay(double newSampleRate, int samplesPerBlock)
{
    sampleRate = newSampleRate;
    voicePool.prepare(sampleRate);
}

void HiHatPercProgrammerAudioProcessor::releaseResources() {}

void HiHatPercProgrammerAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    buffer.clear();

    // Render active audio voices
    voicePool.renderNextBlock(buffer, 0, buffer.getNumSamples());
}

juce::AudioProcessorEditor* HiHatPercProgrammerAudioProcessor::createEditor()
{
    return new HiHatPercProgrammerAudioProcessorEditor(*this);
}

void HiHatPercProgrammerAudioProcessor::getStateInformation(juce::MemoryBlock& destData) {}
void HiHatPercProgrammerAudioProcessor::setStateInformation(const void* data, int sizeInBytes) {}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new HiHatPercProgrammerAudioProcessor();
}
`
    },
    {
      name: 'PluginEditor.h',
      path: 'Source/PluginEditor.h',
      category: 'Plugin',
      content: `#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"

class HiHatPercProgrammerAudioProcessorEditor : public juce::AudioProcessorEditor
{
public:
    explicit HiHatPercProgrammerAudioProcessorEditor(HiHatPercProgrammerAudioProcessor&);
    ~HiHatPercProgrammerAudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    HiHatPercProgrammerAudioProcessor& processorRef;
    juce::Label titleLabel;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(HiHatPercProgrammerAudioProcessorEditor)
};
`
    },
    {
      name: 'PluginEditor.cpp',
      path: 'Source/PluginEditor.cpp',
      category: 'Plugin',
      content: `#include "PluginProcessor.h"
#include "PluginEditor.h"

HiHatPercProgrammerAudioProcessorEditor::HiHatPercProgrammerAudioProcessorEditor(HiHatPercProgrammerAudioProcessor& p)
    : AudioProcessorEditor(&p), processorRef(p)
{
    titleLabel.setText("HI-HAT & PERCUSSION PROGRAMMER", juce::dontSendNotification);
    titleLabel.setFont(juce::FontOptions(16.0f, juce::Font::Bold));
    titleLabel.setColour(juce::Label::textColourId, juce::Colour(0xfff59e0b));
    addAndMakeVisible(titleLabel);

    setSize(780, 480);
}

HiHatPercProgrammerAudioProcessorEditor::~HiHatPercProgrammerAudioProcessorEditor() = default;

void HiHatPercProgrammerAudioProcessorEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff181a20)); // Vintage hardware dark charcoal
    g.setColour(juce::Colour(0xff2d323e));
    g.drawRect(getLocalBounds(), 2);
}

void HiHatPercProgrammerAudioProcessorEditor::resized()
{
    titleLabel.setBounds(16, 12, 400, 28);
}
`
    },
    {
      name: 'README.md',
      path: 'README.md',
      category: 'Doc',
      content: `# Hi-Hat & Percussion Programmer (JUCE VST3 Plugin)

This native VST3 / AU audio plugin project was generated directly from your AI Studio design specifications.

## Prerequisites
1. **JUCE 7 or JUCE 8** installed on your system.
2. **CMake 3.22+**
3. C++20 compatible compiler:
   - **macOS**: Xcode / Apple Clang
   - **Windows**: Visual Studio 2022 / MSVC
   - **Linux**: GCC 11+ or Clang 14+

## How to Build

### 1. Build using CMake
\`\`\`bash
# Create build directory
cmake -B build -DCMAKE_BUILD_TYPE=Release

# Build the VST3 plugin target
cmake --build build --config Release
\`\`\`

The built \`HiHatPercProgrammer.vst3\` binary will be located in:
- macOS: \`build/HiHatPercProgrammer_artefacts/Release/VST3/\`
- Windows: \`build/HiHatPercProgrammer_artefacts/Release/VST3/\`
- Linux: \`build/HiHatPercProgrammer_artefacts/Release/VST3/\`

Copy the \`.vst3\` file into your DAW plugin directory (or run \`cmake --install build\` if configured).
`
    }
  ];
}
