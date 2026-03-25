"""
Azure AI Search インデックス作成スクリプト
実行: python scripts/setup_index.py
"""
import os
from dotenv import load_dotenv
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SearchField,
    SearchFieldDataType,
    SimpleField,
    SearchableField,
)
from azure.core.credentials import AzureKeyCredential

load_dotenv(".env.local")

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"]
KEY = os.environ["AZURE_SEARCH_KEY"]
INDEX_NAME = os.environ.get("AZURE_SEARCH_INDEX_NAME", "exam-knowledge")


def create_index():
    client = SearchIndexClient(ENDPOINT, AzureKeyCredential(KEY))

    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SimpleField(
            name="exam_id",
            type=SearchFieldDataType.String,
            filterable=True,
        ),
        SimpleField(
            name="section",
            type=SearchFieldDataType.String,
            filterable=True,
        ),
        SimpleField(name="subsection", type=SearchFieldDataType.String),
        SearchableField(
            name="content",
            type=SearchFieldDataType.String,
            analyzer_name="ja.microsoft",
        ),
        SimpleField(name="source_url", type=SearchFieldDataType.String),
        SimpleField(
            name="chunk_index",
            type=SearchFieldDataType.Int32,
        ),
    ]

    index = SearchIndex(name=INDEX_NAME, fields=fields)

    try:
        client.delete_index(INDEX_NAME)
        print(f"既存のインデックス '{INDEX_NAME}' を削除しました")
    except Exception:
        pass

    result = client.create_index(index)
    print(f"✅ インデックス '{result.name}' を作成しました")


if __name__ == "__main__":
    create_index()
