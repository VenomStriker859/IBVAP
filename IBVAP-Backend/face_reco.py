import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceRecognizer:

    def __init__(self, known_faces_dir="known_faces", threshold=0.45):
        self.threshold = threshold
        self.names = []
        self.embeddings = []

        self.app = FaceAnalysis(name="buffalo_l")
        self.app.prepare(ctx_id=-1, det_size=(640, 640))

        self.load_faces(known_faces_dir)

    def load_faces(self, folder):
        if not os.path.exists(folder):
            os.makedirs(folder)
            print("Created folder:", folder)
            print("Put registered face images inside it.")
            return

        extensions = (".jpg", ".jpeg", ".png", ".bmp")

        for root, _, files in os.walk(folder):

            for file in files:

                if not file.lower().endswith(extensions):
                    continue

                path = os.path.join(root, file)

                image = cv2.imread(path)

                if image is None:
                    print("Cannot read:", path)
                    continue

                faces = self.app.get(image)

                if len(faces) == 0:
                    print("No face found:", path)
                    continue

                face = max(
                    faces,
                    key=lambda x:
                    (x.bbox[2] - x.bbox[0]) *
                    (x.bbox[3] - x.bbox[1])
                )

                embedding = face.embedding

                embedding = embedding / np.linalg.norm(embedding)

                relative = os.path.relpath(root, folder)

                if relative == ".":
                    name = os.path.splitext(file)[0]
                else:
                    name = os.path.basename(relative)

                name = name.replace("_", " ")

                self.names.append(name)
                self.embeddings.append(embedding)

                print("Registered:", name)

        print("Total registered images:", len(self.embeddings))

    def recognize(self, frame):

        faces = self.app.get(frame)

        results = []

        for face in faces:

            embedding = face.embedding
            embedding = embedding / np.linalg.norm(embedding)

            if len(self.embeddings) == 0:

                name = "Unknown"
                score = 0.0
                registered = False

            else:

                scores = []

                for known in self.embeddings:

                    score = np.dot(
                        embedding,
                        known
                    )

                    scores.append(score)

                index = int(np.argmax(scores))

                score = float(scores[index])

                if score >= self.threshold:

                    name = self.names[index]
                    registered = True

                else:

                    name = "Unknown"
                    registered = False

            box = face.bbox.astype(int)

            results.append({
                "name": name,
                "score": round(score, 3),
                "registered": registered,
                "box": box
            })

        return results


def main():

    recognizer = FaceRecognizer(
        known_faces_dir="known_faces",
        threshold=0.45
    )

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():

        print("ERROR: Camera could not be opened.")
        return

    print("Camera started.")
    print("Press Q to exit.")

    while True:

        success, frame = camera.read()

        if not success:

            print("ERROR: Cannot read camera.")
            break

        results = recognizer.recognize(frame)

        for result in results:

            x1, y1, x2, y2 = result["box"]

            name = result["name"]
            score = result["score"]

            if result["registered"]:

                label = f"REGISTERED: {name} {score:.2f}"

            else:

                label = f"UNKNOWN {score:.2f}"

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 0, 255),
                2
            )

            cv2.putText(
                frame,
                label,
                (x1, max(y1 - 10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2
            )

        cv2.putText(
            frame,
            f"Faces: {len(results)}",
            (20, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        cv2.imshow(
            "IBVAP Face Recognition",
            frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
