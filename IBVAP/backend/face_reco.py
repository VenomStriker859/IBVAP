import os
import numpy as np
import cv2

try:
    import insightface
    from insightface.app import FaceAnalysis
except ImportError as e:
    raise ImportError(
        "insightface is required for face recognition. "
        "Install with: pip install insightface onnxruntime"
    ) from e


class FaceRecognizer:
    def __init__(self, known_faces_dir="known_faces", similarity_threshold=0.45, ctx_id=-1):
        self.similarity_threshold = similarity_threshold
        self.app = FaceAnalysis(name="buffalo_l")
        self.app.prepare(ctx_id=ctx_id, det_size=(640, 640))

        self.known_names = []
        self.known_embeddings = []
        self._load_known_faces(known_faces_dir)

    def _load_known_faces(self, known_faces_dir):
        if not os.path.isdir(known_faces_dir):
            print(f"[FaceRecognizer] Warning: '{known_faces_dir}' not found. "
                  f"No known faces loaded — everyone will be tagged 'Unknown'.")
            return

        valid_ext = (".jpg", ".jpeg", ".png")
        for filename in os.listdir(known_faces_dir):
            if not filename.lower().endswith(valid_ext):
                continue

            path = os.path.join(known_faces_dir, filename)
            img = cv2.imread(path)
            if img is None:
                print(f"[FaceRecognizer] Warning: could not read {path}, skipping.")
                continue

            faces = self.app.get(img)
            if not faces:
                print(f"[FaceRecognizer] Warning: no face detected in {path}, skipping.")
                continue

            name = os.path.splitext(filename)[0].replace("_", " ")
            self.known_names.append(name)
            self.known_embeddings.append(faces[0].normed_embedding)

        print(f"[FaceRecognizer] Loaded {len(self.known_names)} known face(s): {self.known_names}")

    def detect_face(self, image_bgr):
        if image_bgr is None or image_bgr.size == 0:
            return None

        faces = self.app.get(image_bgr)
        if not faces:
            return None

        return max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

    def identify_face(self, face):
        if face is None:
            return "Unknown", None

        embedding = face.normed_embedding

        if not self.known_embeddings:
            return "Unknown", None

        sims = [float(np.dot(embedding, known)) for known in self.known_embeddings]
        best_idx = int(np.argmax(sims))
        best_score = sims[best_idx]

        if best_score >= self.similarity_threshold:
            return self.known_names[best_idx], round(best_score, 3)
        return "Unknown", round(best_score, 3)

    def identify(self, person_crop_bgr):
        face = self.detect_face(person_crop_bgr)
        return self.identify_face(face)