// @ts-nocheck
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const sqlite = new Database("prisma/dev.db", { readonly: true });
const supabase = new PrismaClient();

type Row = Record<string, unknown>;

function parseDate(value: unknown) {
  if (!value) return undefined;
  const date =
    value instanceof Date ? value : new Date(value instanceof Buffer ? value.toString() : String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function loadRows(table: string): Row[] {
  return sqlite.prepare(`SELECT * FROM ${table}`).all();
}

async function upsert<T extends Row>(
  items: T[],
  process: (item: T) => Promise<void>
) {
  for (const item of items) {
    await process(item);
  }
}

async function migrate() {
  try {
    console.log("🔄 Starting migration from SQLite to Supabase...\n");

    const classes = loadRows("Class");
    console.log(`Class records: ${classes.length}`);
    await upsert(classes, async (cls) => {
      await supabase.class.upsert({
        where: { id: cls.id as string },
        create: {
          id: cls.id as string,
          name: cls.name as string,
          displayOrder: Number(cls.displayOrder ?? 0),
          createdAt: parseDate(cls.createdAt) ?? new Date(),
          updatedAt: parseDate(cls.updatedAt) ?? new Date(),
        },
        update: {
          name: cls.name as string,
          displayOrder: Number(cls.displayOrder ?? 0),
          createdAt: parseDate(cls.createdAt) ?? new Date(),
          updatedAt: parseDate(cls.updatedAt) ?? new Date(),
        },
      } as any);
    });
    const subjects = loadRows("Subject");
    console.log(`Subject records: ${subjects.length}`);
    await upsert(subjects, async (subject) => {
      await supabase.subject.upsert({
        where: { id: subject.id as string },
        create: {
          id: subject.id as string,
          name: subject.name as string,
          classId: subject.classId as string,
          createdAt: parseDate(subject.createdAt) ?? new Date(),
          updatedAt: parseDate(subject.updatedAt) ?? new Date(),
        },
        update: {
          name: subject.name as string,
          classId: subject.classId as string,
          createdAt: parseDate(subject.createdAt) ?? new Date(),
          updatedAt: parseDate(subject.updatedAt) ?? new Date(),
        },
      });
    });

    const chapters = loadRows("Chapter");
    console.log(`Chapter records: ${chapters.length}`);
    await upsert(chapters, async (chapter) => {
      await supabase.chapter.upsert({
        where: { id: chapter.id as string },
        create: {
          id: chapter.id as string,
          name: chapter.name as string,
          subjectId: chapter.subjectId as string,
          createdAt: parseDate(chapter.createdAt) ?? new Date(),
          updatedAt: parseDate(chapter.updatedAt) ?? new Date(),
        },
        update: {
          name: chapter.name as string,
          subjectId: chapter.subjectId as string,
          createdAt: parseDate(chapter.createdAt) ?? new Date(),
          updatedAt: parseDate(chapter.updatedAt) ?? new Date(),
        },
      });
    });

    const resources = loadRows("Resource");
    console.log(`Resource records: ${resources.length}`);
    await upsert(resources, async (resource) => {
      await supabase.resource.upsert({
        where: { id: resource.id as string },
        create: {
          id: resource.id as string,
          title: resource.title as string,
          type: resource.type as string,
          description: resource.description as string | null,
          link: resource.link as string,
          chapterId: (resource.chapterId as string) ?? null,
          subjectId: (resource.subjectId as string) ?? null,
          createdAt: parseDate(resource.createdAt) ?? new Date(),
          updatedAt: parseDate(resource.updatedAt) ?? new Date(),
        },
        update: {
          title: resource.title as string,
          type: resource.type as string,
          description: resource.description as string | null,
          link: resource.link as string,
          chapterId: (resource.chapterId as string) ?? null,
          subjectId: (resource.subjectId as string) ?? null,
          createdAt: parseDate(resource.createdAt) ?? new Date(),
          updatedAt: parseDate(resource.updatedAt) ?? new Date(),
        },
      });
    });

    const authorizedEmails = loadRows("AuthorizedEmail");
    console.log(`AuthorizedEmail records: ${authorizedEmails.length}`);
    await upsert(authorizedEmails, async (entry) => {
      await supabase.authorizedEmail.upsert({
        where: { email: entry.email as string },
        create: {
          id: entry.id as string,
          email: entry.email as string,
          role: entry.role as string,
          classId: (entry.classId as string) ?? null,
          createdAt: parseDate(entry.createdAt) ?? new Date(),
        },
        update: {
          role: entry.role as string,
          classId: (entry.classId as string) ?? null,
          createdAt: parseDate(entry.createdAt) ?? new Date(),
        },
      });
    });

    const users = loadRows("User");
    console.log(`User records: ${users.length}`);
    await upsert(users, async (user) => {
      await supabase.user.upsert({
        where: { id: user.id as string },
        create: {
          id: user.id as string,
          name: (user.name as string) ?? null,
          email: user.email as string,
          emailVerified: parseDate(user.emailVerified) ?? null,
          image: (user.image as string) ?? null,
          role: user.role as string,
          classId: (user.classId as string) ?? null,
          createdAt: parseDate(user.createdAt) ?? new Date(),
          updatedAt: parseDate(user.updatedAt) ?? new Date(),
        },
        update: {
          name: (user.name as string) ?? null,
          email: user.email as string,
          emailVerified: parseDate(user.emailVerified) ?? null,
          image: (user.image as string) ?? null,
          role: user.role as string,
          classId: (user.classId as string) ?? null,
          createdAt: parseDate(user.createdAt) ?? new Date(),
          updatedAt: parseDate(user.updatedAt) ?? new Date(),
        },
      });
    });

    console.log("\n✅ Migration completed successfully.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exitCode = 1;
  } finally {
    sqlite.close();
    await supabase.$disconnect();
  }
}

migrate();
