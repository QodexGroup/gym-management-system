const LegalDocumentSections = ({ 
  sections, 
  activeSection, 
  sectionAttr = 'data-legal-section',
  variant = 'terms'
}) => {
  // Determine highlight style configurations programmatically
  const activeClass = variant === 'privacy'
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : 'border-primary-500/40 bg-primary-500/5';

  return (
    <div className="space-y-5">
      {sections.map((section, index) => (
        <section
          key={section.title}
          {...{ [sectionAttr]: true }}
          className={`rounded-xl border p-4 transition-colors ${
            activeSection === undefined
              ? 'border-dark-700 bg-dark-900/40'
              : index === activeSection
                ? activeClass
                : 'border-dark-700 bg-dark-900/40'
          }`}
        >
          <h3 className="text-sm font-semibold text-dark-50 mb-2">{section.title}</h3>
          {section.subtitle && (
            <p className="text-xs font-medium text-dark-300 mb-2">{section.subtitle}</p>
          )}
          {section.body?.map((paragraph) => (
            <p key={paragraph} className="text-sm text-dark-300 leading-relaxed mb-2">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="list-disc list-inside space-y-1 mb-2">
              {section.list.map((item) => (
                <li key={item} className="text-sm text-dark-300">
                  {item}
                </li>
              ))}
            </ul>
          )}
          {section.footer && (
            <p className="text-sm text-dark-300 leading-relaxed">{section.footer}</p>
          )}
          {section.contact && (
            <div className="text-sm text-dark-300 space-y-1 mt-2">
              <p className="font-medium text-dark-200">{section.contact.name}</p>
              {section.contact.representative && <p>Representative: {section.contact.representative}</p>}
              <p>Email: {section.contact.email}</p>
              <p>Phone: {section.contact.mobile || section.contact.phone}</p>
              {section.contact.status && <p>Status: {section.contact.status}</p>}
              {section.contact.projectStatus && <p>Status: {section.contact.projectStatus}</p>}
              <p>Address: {section.contact.address}</p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default LegalDocumentSections;