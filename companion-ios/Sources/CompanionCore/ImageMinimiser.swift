// Capture minimisation on the phone (DEC-006): rotate upright from the EXIF orientation
// *first*, then re-encode without any metadata (EXIF, GPS, maker notes), downscaled.
// The backend rejects photos that still carry EXIF, so this must run before upload.
import Foundation

public struct MinimisedImage: Equatable {
    public let data: Data
    public let mime: String
    /// Values for ContextCapture.minimisation.
    public let steps: [String]
}

public enum ImageMinimiserError: Error { case unreadable, encodeFailed, unsupportedPlatform }

#if canImport(ImageIO)
import ImageIO
#if canImport(UniformTypeIdentifiers)
import UniformTypeIdentifiers
#endif

public enum ImageMinimiser {
    public static let maxPixelSize = 1600

    public static func minimise(_ input: Data, maxPixelSize: Int = ImageMinimiser.maxPixelSize, quality: Double = 0.85) throws -> MinimisedImage {
        guard let source = CGImageSourceCreateWithData(input as CFData, nil) else { throw ImageMinimiserError.unreadable }
        // The thumbnail API applies the EXIF orientation and downscales in one step.
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
        ]
        guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { throw ImageMinimiserError.unreadable }
        let out = NSMutableData()
        guard let dest = CGImageDestinationCreateWithData(out, "public.jpeg" as CFString, 1, nil) else { throw ImageMinimiserError.encodeFailed }
        // Only the compression quality is written: no EXIF, GPS or TIFF dictionaries.
        CGImageDestinationAddImage(dest, image, [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary)
        guard CGImageDestinationFinalize(dest) else { throw ImageMinimiserError.encodeFailed }
        return MinimisedImage(data: out as Data, mime: "image/jpeg", steps: ["orientation_applied", "exif_stripped", "gps_removed", "downscaled"])
    }
}
#else
public enum ImageMinimiser {
    /// Without ImageIO (e.g. Linux test runs) nothing can be re-encoded. Only images that are
    /// already clean (like MockGlassesBridge.sampleJPEG) may pass through.
    public static func minimise(_ input: Data, maxPixelSize: Int = 1600, quality: Double = 0.85) throws -> MinimisedImage {
        guard !containsEXIF(input) else { throw ImageMinimiserError.unsupportedPlatform }
        return MinimisedImage(data: input, mime: "image/jpeg", steps: ["exif_stripped"])
    }
}
#endif

/// True if a JPEG still contains an APP1 "Exif" segment.
public func containsEXIF(_ jpeg: Data) -> Bool {
    jpeg.range(of: Data("Exif\0\0".utf8)) != nil
}
