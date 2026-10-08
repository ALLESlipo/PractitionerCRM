-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "practitioner_role" AS ENUM ('practitioner', 'admin');

-- CreateEnum
CREATE TYPE "kit_status" AS ENUM ('awaiting_results', 'results_uploaded', 'sent_to_client');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('mimatest_report', 'food_guide');

-- CreateEnum
CREATE TYPE "email_status" AS ENUM ('queued', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "result_flag" AS ENUM ('low', 'below_optimal', 'optimal', 'above_optimal', 'high');

-- CreateEnum
CREATE TYPE "chat_role" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending', 'approved', 'needs_info', 'rejected');

-- CreateTable
CREATE TABLE "practitioners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "practitioner_role" NOT NULL DEFAULT 'practitioner',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practitioner_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practitioner_credentials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practitioner_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "review_status" "review_status" NOT NULL DEFAULT 'pending',
    "reviewer_note" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practitioner_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practitioner_profiles" (
    "practitioner_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "specialty" TEXT,
    "clinic_name" TEXT,
    "city" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "public_email" TEXT,
    "public_phone" TEXT,
    "profile_image_path" TEXT,
    "cover_image_path" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practitioner_profiles_pkey" PRIMARY KEY ("practitioner_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practitioner_id" UUID NOT NULL,
    "full_name_enc" BYTEA NOT NULL,
    "email_enc" BYTEA NOT NULL,
    "email_hash" BYTEA NOT NULL,
    "phone_enc" BYTEA,
    "date_of_birth_enc" BYTEA,
    "sex" TEXT,
    "notes_enc" BYTEA,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_kits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "kit_code" TEXT NOT NULL,
    "access_code_enc" BYTEA NOT NULL,
    "status" "kit_status" NOT NULL DEFAULT 'awaiting_results',
    "sample_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "test_kit_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "doc_type" "document_type" NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markers" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "default_ref_min" DECIMAL(65,30),
    "default_ref_max" DECIMAL(65,30),
    "description" TEXT,

    CONSTRAINT "markers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marker_results" (
    "id" BIGSERIAL NOT NULL,
    "test_kit_id" UUID NOT NULL,
    "source_document_id" UUID,
    "marker_id" INTEGER NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "unit" TEXT,
    "ref_min" DECIMAL(65,30),
    "ref_max" DECIMAL(65,30),
    "flag" "result_flag",
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marker_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practitioner_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "email_status" NOT NULL DEFAULT 'queued',
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_message_documents" (
    "email_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "link_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "first_opened_at" TIMESTAMPTZ,
    "open_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_message_documents_pkey" PRIMARY KEY ("email_id","document_id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practitioner_id" UUID NOT NULL,
    "test_kit_id" UUID,
    "title" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" BIGSERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "role" "chat_role" NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "file_path" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" BIGSERIAL NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1024),
    "metadata" JSONB,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "practitioner_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "practitioners_email_key" ON "practitioners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_practitioner_id_idx" ON "sessions"("practitioner_id");

-- CreateIndex
CREATE INDEX "idx_credentials_practitioner" ON "practitioner_credentials"("practitioner_id");

-- CreateIndex
CREATE UNIQUE INDEX "practitioner_profiles_slug_key" ON "practitioner_profiles"("slug");

-- CreateIndex
CREATE INDEX "idx_clients_practitioner_active" ON "clients"("practitioner_id") WHERE (archived_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "uq_clients_email_per_practitioner" ON "clients"("practitioner_id", "email_hash") WHERE (archived_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "test_kits_kit_code_key" ON "test_kits"("kit_code");

-- CreateIndex
CREATE INDEX "idx_test_kits_client" ON "test_kits"("client_id");

-- CreateIndex
CREATE INDEX "idx_client_documents_client" ON "client_documents"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "markers_code_key" ON "markers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "marker_results_test_kit_id_marker_id_key" ON "marker_results"("test_kit_id", "marker_id");

-- CreateIndex
CREATE INDEX "idx_email_messages_client" ON "email_messages"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_message_documents_link_token_hash_key" ON "email_message_documents"("link_token_hash");

-- CreateIndex
CREATE INDEX "idx_chat_sessions_practitioner" ON "chat_sessions"("practitioner_id");

-- CreateIndex
CREATE INDEX "idx_chat_messages_session" ON "chat_messages"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunks_document_id_chunk_index_key" ON "knowledge_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "idx_audit_logs_practitioner" ON "audit_logs"("practitioner_id", "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practitioner_credentials" ADD CONSTRAINT "practitioner_credentials_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practitioner_credentials" ADD CONSTRAINT "practitioner_credentials_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practitioner_profiles" ADD CONSTRAINT "practitioner_profiles_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_kits" ADD CONSTRAINT "test_kits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_test_kit_id_fkey" FOREIGN KEY ("test_kit_id") REFERENCES "test_kits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marker_results" ADD CONSTRAINT "marker_results_test_kit_id_fkey" FOREIGN KEY ("test_kit_id") REFERENCES "test_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marker_results" ADD CONSTRAINT "marker_results_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "client_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marker_results" ADD CONSTRAINT "marker_results_marker_id_fkey" FOREIGN KEY ("marker_id") REFERENCES "markers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_message_documents" ADD CONSTRAINT "email_message_documents_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_message_documents" ADD CONSTRAINT "email_message_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "client_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_test_kit_id_fkey" FOREIGN KEY ("test_kit_id") REFERENCES "test_kits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CHECK constraints from schema v0.2 (not expressible in the Prisma schema)
ALTER TABLE "clients" ADD CONSTRAINT "clients_sex_check" CHECK (sex IN ('F', 'M', 'other'));
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_report_needs_kit"
    CHECK (doc_type <> 'mimatest_report' OR test_kit_id IS NOT NULL);
