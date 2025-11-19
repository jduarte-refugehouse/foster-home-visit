# Refuge House Multi-Microservice Platform - Documentation

Welcome to the Refuge House multi-microservice platform documentation. This monorepo contains all microservices for the Refuge House organization, sharing foundational code through the `packages/shared-core/` package.

## 📚 Documentation Index

### 🚀 Getting Started

- **[Microservice Creation Guide](./microservice-creation-guide.md)** - Step-by-step guide for creating a new microservice domain
- **[Shared-Core Reference](./shared-core-reference.md)** - Complete API reference for all shared utilities
- **[Monorepo Completion Status](./monorepo-completion-status.md)** - Migration status and what's been completed

### 🏗️ Architecture & Planning

- **[Multi-Microservice Architecture Plan](./multi-microservice-architecture-plan.md)** - Overall architecture and design decisions
- **[Database Architecture](./database-architecture.md)** - Database schema and relationships
- **[Authentication & Permissions Methodology](./authentication-permissions-methodology.md)** - Security model and permissions system

### 📦 Shared-Core Package

- **[Shared-Core Reference](./shared-core-reference.md)** - Complete API documentation
- **[Shared-Core Audit](./shared-core-audit.md)** - What's been moved and what remains

### 🔧 Development Guides

- **[Development Workflow](./development-workflow.md)** - ⚠️ **CRITICAL: Remote testing workflow**
- **[Vercel Branch Deployment Strategy](./vercel-branch-deployment-strategy.md)** - How to configure branch-based deployments for microservices
- **[Navigation Specification](./navigation-specification.md)** - How navigation works
- **[Refuge House Style Guide](./refuge-house-style-guide.md)** - UI/UX guidelines
- **[Quick Reference for AI](./quick-reference-for-ai.md)** - Context for AI assistants

### 📋 Feature Documentation

- **[Enhanced Home Visit Form](./enhanced-home-visit-form.md)** - Home visit form features
- **[Travel Tracking Architecture](./travel-tracking-architecture.md)** - Travel leg tracking system
- **[Continuum Logging](./continuum-logging.md)** - Event logging to Continuum
- **[Speech-to-Text Setup](./SPEECH_TO_TEXT.md)** - Speech recognition features

### 🗄️ Database

- **[Bifrost Schema](./bifrost-schema.sql)** - Main database schema
- **[Radius Schema](./radius-radiusrhsa-schema.sql)** - Radius database schema
- **[RHData Schema](./rhdata-schema.sql)** - RHData database schema

### 🔐 Security & Access

- **[Authentication & Permissions Methodology](./authentication-permissions-methodology.md)** - Security model
- **[Case Manager Review Requirements](./case-manager-review-requirements.md)** - Review workflow

### 🧪 Testing & Setup

- **[Development Workflow](./development-workflow.md)** - ⚠️ **CRITICAL: Remote testing workflow (no local testing)**
- **[Testing Public Signature Routes](./testing-public-signature-routes.md)** - Signature testing
- **[Testing Travel Legs Mobile](./testing-travel-legs-mobile.md)** - Mobile travel testing
- **[iPad Safari Console Debugging](./ipad-safari-console-debugging.md)** - Mobile debugging

### 🔌 Integrations

- **[Google Cloud Speech Setup](./google-cloud-speech-setup.md)** - Google Speech-to-Text
- **[Deepgram Setup](./setup-deepgram.md)** - Deepgram integration
- **[Pulse App API Key Setup](./pulse-app-api-key-setup.md)** - Pulse integration
- **[SendGrid Setup](./setup-google-speech-streaming.md)** - Email integration

### 📝 Daily Activity Summaries

- Various daily activity summaries documenting development progress

## 🎯 Quick Links

### For New Developers

1. Start with **[Microservice Creation Guide](./microservice-creation-guide.md)**
2. Review **[Shared-Core Reference](./shared-core-reference.md)** for available utilities
3. Check **[Multi-Microservice Architecture Plan](./multi-microservice-architecture-plan.md)** for overall design

### For Creating New Microservices

1. **[Microservice Creation Guide](./microservice-creation-guide.md)** - Complete step-by-step guide
2. **[Database Setup](./bifrost-schema.sql)** - Database schema reference
3. **[Authentication & Permissions](./authentication-permissions-methodology.md)** - Security setup

### For Using Shared-Core

1. **[Shared-Core Reference](./shared-core-reference.md)** - Complete API documentation
2. **[Monorepo Completion Status](./monorepo-completion-status.md)** - What's available

## 📊 Project Status

- **Monorepo Structure**: ✅ Complete
- **Shared-Core Package**: ✅ Complete
- **Documentation**: ✅ Complete
- **Ready for Production**: ✅ Yes

## 🔗 External Resources

- **Vercel Dashboard**: [vercel.com](https://vercel.com)
- **Clerk Dashboard**: [clerk.com](https://clerk.com)
- **Azure Portal**: [portal.azure.com](https://portal.azure.com)

## 📞 Support

For questions or issues:
1. Check the relevant documentation above
2. Review code comments in `packages/shared-core/`
3. Check existing issues or create new ones

---

**Last Updated**: January 2025  
**Status**: Production Ready

