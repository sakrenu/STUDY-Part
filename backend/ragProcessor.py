import PyPDF2
from io import BytesIO
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

class RAGProcessor:
    def __init__(self):
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents = []

    def extract_text(self, file_content, file_type):
        if file_type == 'application/pdf':
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
            return text
        elif file_type == 'text/plain':
            return file_content.decode('utf-8')
        return ""

    def add_document(self, text):
        sentences = [s.strip() for s in text.split('. ') if s.strip()]
        embeddings = self.embedder.encode(sentences)
        self.index.add(np.array(embeddings, dtype=np.float32))
        self.documents.append(sentences)
        return len(sentences)

    def retrieve_context(self, query, k=5):
        query_embedding = self.embedder.encode(query)
        D, I = self.index.search(np.array([query_embedding], dtype=np.float32), k)
        context = []
        for i in I[0]:
            if i < len(self.documents[-1]):
                context.append(self.documents[-1][i])
        return ". Bez".join(context)