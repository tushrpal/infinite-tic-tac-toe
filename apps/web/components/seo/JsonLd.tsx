type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Renders JSON-LD structured data for SEO, AEO, and GEO. */
export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
