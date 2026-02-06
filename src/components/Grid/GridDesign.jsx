import GridDesignOne from './GridDesignOne';
import GridDesignTwo from './GridDesignTwo';

const GridDesign = ({
    type = 'GridDesignOne', // layout style
    items = [],             // any array of objects
    columns = 3,            // number of columns
    dark = false,
    renderItem,             // function to render each item (legacy)
    renderCard,             // function to render each card with props
  }) => {
    try {
      // Validate inputs
      if (!Array.isArray(items)) {
        console.warn('GridDesign: items must be an array');
        return null;
      }
      
      if (items.length === 0) {
        return null;
      }
      
      const gridColsClass = {
        1: 'grid-cols-1',
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
      }[columns] || 'md:grid-cols-3';

      // If renderCard is provided, use it to render the appropriate component
      if (renderCard && typeof renderCard === 'function') {
        return (
          <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
            {items.map((item, index) => {
              const cardProps = renderCard(item, index);
              if (!cardProps) return null;
              
              if (type === 'GridDesignTwo') {
                return <GridDesignTwo key={item.id || index} {...cardProps} />;
              }
              return <GridDesignOne key={item.id || index} {...cardProps} />;
            })}
          </div>
        );
      }
  
      const baseProps = { items, gridColsClass, dark, renderItem };
  
      switch (type) {
        case 'GridDesignTwo':
          return <GridDesignTwo {...baseProps} />;
        case 'GridDesignOne':
        default:
          return <GridDesignOne {...baseProps} />;
      }
    } catch (error) {
      console.error('GridDesign error:', error);
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">Error rendering grid: {error.message}</p>
        </div>
      );
    }
  };
  
  export default GridDesign;
  