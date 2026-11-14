// Speech in (device ASR) and speech out (device TTS), iOS only.
// Audio goes over the phone's Bluetooth HFP route, not through DAT (ARCHITECTURE.md §2.1).
#if os(iOS)
import AVFoundation
import Speech
import Contracts

/// Routes audio to the glasses over Bluetooth HFP *before* any camera stream starts (S04).
/// HFP is two-way, narrow-band mono; we keep it for the whole conversation (half-duplex:
/// the mic is paused while we speak, so no echo cancellation is needed).
public final class AudioRouteManager {
    public init() {}

    @discardableResult
    public func activateHFP() throws -> AudioRoute {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .duckOthers])
        try session.setActive(true)
        return currentRoute()
    }

    public func currentRoute() -> AudioRoute {
        let route = AVAudioSession.sharedInstance().currentRoute
        if route.inputs.contains(where: { $0.portType == .bluetoothHFP }) { return .glassesHfp }
        if route.outputs.contains(where: { $0.portType == .bluetoothA2DP }) { return .glassesA2DP }
        return .phone
    }
}

/// On-device speech recognition with partial results and end-of-speech detection.
/// Finnish on-device support varies by iOS version: if unsupported, recognition falls back to
/// Apple's server (check `usesOnDevice` and say so in the privacy notice).
public final class SpeechInput {
    public private(set) var usesOnDevice = false
    private let engine = AVAudioEngine()
    private var task: SFSpeechRecognitionTask?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var silenceTimer: Timer?
    /// Silence after the last partial result that ends the utterance (ARCHITECTURE.md §4.3: 300–600 ms).
    public var endOfSpeech: TimeInterval = 0.6

    public init() {}

    public static func requestPermissions() async -> Bool {
        let speech = await withCheckedContinuation { c in SFSpeechRecognizer.requestAuthorization { c.resume(returning: $0 == .authorized) } }
        let mic = await AVAudioApplication.requestRecordPermission()
        return speech && mic
    }

    /// Listens until end of speech, calling `onPartial` as words arrive (e.g. to start the camera early).
    public func listen(locale: String, onPartial: @escaping (String) -> Void) async throws -> Transcript {
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale)), recognizer.isAvailable else {
            throw GlassesError.unavailable("speech recognizer unavailable for \(locale)")
        }
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        usesOnDevice = recognizer.supportsOnDeviceRecognition
        request.requiresOnDeviceRecognition = usesOnDevice
        self.request = request

        let input = engine.inputNode
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buffer, _ in request.append(buffer) }
        engine.prepare()
        try engine.start()

        return try await withCheckedThrowingContinuation { continuation in
            var finished = false
            func finish(_ result: Result<Transcript, Error>) {
                guard !finished else { return }
                finished = true
                self.stop()
                continuation.resume(with: result)
            }
            task = recognizer.recognitionTask(with: request) { [weak self] result, error in
                guard let self else { return }
                if let result {
                    let text = result.bestTranscription.formattedString
                    onPartial(text)
                    let segments = result.bestTranscription.segments
                    let confidence = segments.isEmpty ? nil : Double(segments.map(\.confidence).reduce(0, +)) / Double(segments.count)
                    let transcript = Transcript(asrProvider: self.usesOnDevice ? "asr.device" : "asr.apple_server",
                                                confidence: confidence, lang: locale, text: text)
                    if result.isFinal { return finish(.success(transcript)) }
                    DispatchQueue.main.async {
                        self.silenceTimer?.invalidate()
                        self.silenceTimer = Timer.scheduledTimer(withTimeInterval: self.endOfSpeech, repeats: false) { _ in
                            if !text.isEmpty { finish(.success(transcript)) }
                        }
                    }
                } else if let error {
                    finish(.failure(error))
                }
            }
        }
    }

    public func stop() {
        silenceTimer?.invalidate()
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
    }
}

/// Device text-to-speech. `stop()` flushes immediately (barge-in / "stop", DEC-011).
public final class SpeechOutput: NSObject, AVSpeechSynthesizerDelegate {
    private let synth = AVSpeechSynthesizer()
    private var finished: CheckedContinuation<Void, Never>?

    public override init() {
        super.init()
        synth.delegate = self
    }

    public func speak(_ text: String, locale: String) async {
        stop()
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: locale) ?? AVSpeechSynthesisVoice(language: String(locale.prefix(2)))
        await withCheckedContinuation { c in
            finished = c
            synth.speak(utterance)
        }
    }

    public func stop() {
        if synth.isSpeaking { synth.stopSpeaking(at: .immediate) }
        resume()
    }

    public func speechSynthesizer(_ s: AVSpeechSynthesizer, didFinish u: AVSpeechUtterance) { resume() }
    public func speechSynthesizer(_ s: AVSpeechSynthesizer, didCancel u: AVSpeechUtterance) { resume() }

    private func resume() {
        finished?.resume()
        finished = nil
    }
}
#endif
