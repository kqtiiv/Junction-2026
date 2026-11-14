// Removes metadata segments from a JPEG without re-encoding it.
// Apple's ImageIO writes an APP1 "Exif" block into every JPEG it encodes (colour space,
// pixel dimensions), even when no metadata is passed, so re-encoding alone does not satisfy
// `exif_stripped`. CI found this: the backend rejected the simulator's capture as still
// carrying EXIF. This walks the JPEG's header segments and drops:
//   APP1  (EXIF and XMP: camera, time, location),
//   APP13 (IPTC / Photoshop),
//   COM   (free-text comments).
// It keeps everything needed to decode the image (JFIF, ICC colour profile, tables, frame, scan).
import Foundation

public enum JPEGMetadataStripper {
    public enum StripError: Error, Equatable { case notJPEG, truncated }

    private static let dropped: Set<UInt8> = [0xE1, 0xED, 0xFE]   // APP1, APP13, COM

    public static func strip(_ jpeg: Data) throws -> Data {
        let b = [UInt8](jpeg)
        guard b.count >= 4, b[0] == 0xFF, b[1] == 0xD8 else { throw StripError.notJPEG }
        var out: [UInt8] = [0xFF, 0xD8]
        var i = 2
        while i < b.count {
            guard b[i] == 0xFF, i + 1 < b.count else { throw StripError.truncated }
            var j = i + 1
            while j < b.count, b[j] == 0xFF { j += 1 }               // fill bytes
            guard j < b.count else { throw StripError.truncated }
            let marker = b[j]
            // Start of scan or end of image: the rest is entropy-coded data; copy it verbatim.
            if marker == 0xDA || marker == 0xD9 {
                out.append(contentsOf: b[i...])
                return Data(out)
            }
            // Markers without a length field (TEM, RSTn) are copied as they are.
            if marker == 0x01 || (0xD0...0xD7).contains(marker) {
                out.append(contentsOf: b[i...j])
                i = j + 1
                continue
            }
            guard j + 2 < b.count else { throw StripError.truncated }
            let length = Int(b[j + 1]) << 8 | Int(b[j + 2])
            let end = j + 1 + length
            guard length >= 2, end <= b.count else { throw StripError.truncated }
            if !dropped.contains(marker) { out.append(contentsOf: b[i..<end]) }
            i = end
        }
        return Data(out)
    }
}
