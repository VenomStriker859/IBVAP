
import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceRecognizer:

    def __init__(
        self,
        known_faces_dir="known_faces",
        threshold=0.55
    ):
        self.known_faces_dir = known_faces_dir
        self.threshold = threshold
        self.database = {}

        self.app = FaceAnalysis(
            name="buffalo_l"
        )

        self.app.prepare(
            ctx_id=-1,
            det_size=(640, 640)
        )

        self.load_database()

    def normalize(self, embedding):
        norm = np.linalg.norm(embedding)

        if norm == 0:
            return embedding

        return embedding / norm

    def load_database(self):

        if not os.path.exists(
            self.known_faces_dir
        ):
            os.makedirs(
                self.known_faces_dir
            )

            print(
                "Created known_faces folder."
            )

            return

        extensions = (
            ".jpg",
            ".jpeg",
            ".png",
            ".bmp",
            ".webp"
        )

        person_embeddings = {}

        for root, _, files in os.walk(
            self.known_faces_dir
        ):

            for filename in files:

                if not filename.lower().endswith(
                    extensions
                ):
                    continue

                path = os.path.join(
                    root,
                    filename
                )

                image = cv2.imread(
                    path
                )

                if image is None:
                    print(
                        "Could not read:",
                        path
                    )
                    continue

                try:
                    faces = self.app.get(
                        image
                    )
                except Exception as e:
                    print(
                        "Error processing:",
                        path,
                        e
                    )
                    continue

                if len(faces) == 0:
                    print(
                        "No face found:",
                        path
                    )
                    continue

                face = max(
                    faces,
                    key=lambda f:
                    (f.bbox[2] - f.bbox[0]) *
                    (f.bbox[3] - f.bbox[1])
                )

                embedding = face.normed_embedding

                if embedding is None:
                    continue

                embedding = self.normalize(
                    np.asarray(
                        embedding,
                        dtype=np.float32
                    )
                )

                relative = os.path.relpath(
                    root,
                    self.known_faces_dir
                )

                if relative == ".":
                    name = os.path.splitext(
                        filename
                    )[0]
                else:
                    name = os.path.basename(
                        relative
                    )

                name = name.replace(
                    "_",
                    " "
                ).strip()

                if name not in person_embeddings:
                    person_embeddings[name] = []

                person_embeddings[name].append(
                    embedding
                )

                print(
                    f"Loaded: {name} - {filename}"
                )

        for name, embeddings in person_embeddings.items():

            if len(embeddings) == 0:
                continue

            average_embedding = np.mean(
                embeddings,
                axis=0
            )

            average_embedding = self.normalize(
                average_embedding
            )

            self.database[name] = average_embedding

        print()
        print(
            "Registered people:",
            len(self.database)
        )

        for name in self.database:
            print(
                " -",
                name
            )

    def recognize(self, frame):

        faces = self.app.get(
            frame
        )

        results = []

        for face in faces:

            embedding = face.normed_embedding

            if embedding is None:
                continue

            embedding = self.normalize(
                np.asarray(
                    embedding,
                    dtype=np.float32
                )
            )

            best_name = "Unknown"
            best_score = -1.0

            for name, known_embedding in self.database.items():

                score = float(
                    np.dot(
                        embedding,
                        known_embedding
                    )
                )

                if score > best_score:
                    best_score = score
                    best_name = name

            if best_score >= self.threshold:
                registered = True
            else:
                best_name = "Unknown"
                registered = False

            box = face.bbox.astype(
                int
            )

            results.append(
                {
                    "name": best_name,
                    "score": round(
                        best_score,
                        3
                    ),
                    "registered": registered,
                    "box": box
                }
            )

        return results


def main():

    recognizer = FaceRecognizer(
        known_faces_dir="known_faces",
        threshold=0.55
    )

    camera = cv2.VideoCapture(
        0
    )

    if not camera.isOpened():

        print(
            "ERROR: Camera could not be opened."
        )

        return

    print(
        "Camera started."
    )

    print(
        "Press Q to exit."
    )

    while True:

        success, frame = camera.read()

        if not success:

            print(
                "ERROR: Could not read camera."
            )

            break

        results = recognizer.recognize(
            frame
        )

        for result in results:

            x1, y1, x2, y2 = result[
                "box"
            ]

            name = result[
                "name"
            ]

            score = result[
                "score"
            ]

            if result["registered"]:

                color = (0, 255, 0)

                label = (
                    f"REGISTERED: "
                    f"{name} "
                    f"{score:.2f}"
                )

            else:

                color = (0, 0, 255)

                label = (
                    f"UNKNOWN "
                    f"{score:.2f}"
                )

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                color,
                2
            )

            text_y = max(
                y1 - 10,
                25
            )

            cv2.putText(
                frame,
                label,
                (
                    x1,
                    text_y
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2
            )

        cv2.putText(
            frame,
            f"Faces: {len(results)}",
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        cv2.imshow(
            "IBVAP Face Recognition",
            frame
        )

        key = cv2.waitKey(
            1
        ) & 0xFF

        if key == ord("q"):
            break

    camera.release()

    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()

