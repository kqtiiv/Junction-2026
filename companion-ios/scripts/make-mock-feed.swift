// Renders App/Resources/demo_price_label.jpg into a short HEVC (h.265) video that Meta's
// Mock Device Kit streams as the simulated glasses camera feed (it only accepts HEVC video).
// macOS only (AVFoundation + an HEVC encoder):
//   swift companion-ios/scripts/make-mock-feed.swift <in.jpg> <out.mp4>
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO

let args = CommandLine.arguments
guard args.count == 3 else { fatalError("usage: make-mock-feed.swift <in.jpg> <out.mp4>") }
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: output)

guard let src = CGImageSourceCreateWithURL(input as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("cannot read \(input.path)") }
let width = image.width & ~1, height = image.height & ~1   // HEVC wants even dimensions

let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.hevc,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
])
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoInput, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
])
writer.add(videoInput)
guard writer.startWriting() else { fatalError("writer failed: \(String(describing: writer.error))") }
writer.startSession(atSourceTime: .zero)

var buffer: CVPixelBuffer?
CVPixelBufferCreate(nil, width, height, kCVPixelFormatType_32ARGB, nil, &buffer)
guard let pixels = buffer else { fatalError("no pixel buffer") }
CVPixelBufferLockBaseAddress(pixels, [])
let ctx = CGContext(data: CVPixelBufferGetBaseAddress(pixels), width: width, height: height, bitsPerComponent: 8,
                    bytesPerRow: CVPixelBufferGetBytesPerRow(pixels), space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
ctx.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
CVPixelBufferUnlockBaseAddress(pixels, [])

let fps: Int32 = 15
for frame in 0..<(Int(fps) * 3) {   // 3 s; the mock loops the feed
    while !videoInput.isReadyForMoreMediaData { usleep(1_000) }
    adaptor.append(pixels, withPresentationTime: CMTime(value: CMTimeValue(frame), timescale: fps))
}
videoInput.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
guard writer.status == .completed else { fatalError("finish failed: \(String(describing: writer.error))") }
print("wrote \(output.path) (\(width)x\(height), HEVC)")
