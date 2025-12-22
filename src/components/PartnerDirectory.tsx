import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PartnerCard from './PartnerCard';
import { getPartnersByCategory, getCategoryConfig } from '../utils/partnerBranding';

interface Partner {
  partner_id: string;
  display_name: string;
  points_rate: number;
  category: string;
  is_active: boolean;
}

export default function PartnerDirectory() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, selectedCategory, searchTerm]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('partners')
        .select('partner_id, display_name, points_rate, category, is_active')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Error loading partners:', error);
        return;
      }

      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPartners = () => {
    let filtered = partners;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(partner => partner.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(partner =>
        partner.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPartners(filtered);
  };

  const categories = Array.from(new Set(partners.map(p => p.category)));
  const partnersByCategory = getPartnersByCategory();

  if (loading) {
    return (
      <div className="amex-card" style={{ padding: 'var(--amex-space-12)' }}>
        <div className="amex-text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
          <p className="amex-card-subtitle" style={{ marginTop: 'var(--amex-space-3)' }}>Loading partner directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="nedbank-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-fullmx-auto">
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="nedbank-text-large mb-2">Partner Directory</h3>
          <p className="text-gray-500">Discover where you can earn loyalty points</p>
        </div>

        {/* Search and Filter */}
        <div className="sm:flex-row ga">
          {/* Search */}
          <div className="-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <nedbank-input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3-none focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-3-none focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(category => {
                const config = getCategoryConfig(category);
                return (
                  <option key={category} value={category}>
                    {config.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 ga">
        <div className="text-center">
          <p className="text-2xl font-bold">{partners.length}</p>
          <p className="text-sm text-gray-500">Active Partners</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{categories.length}</p>
          <p className="text-sm text-gray-500">Categories</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {Math.max(...partners.map(p => p.points_rate))}x
          </p>
          <p className="text-sm text-gray-500">Max Points Rate</p>
        </div>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="p-8text-center">
          <MapPin className="w-12 h-12 mx-autotext-gray-300" />
          <h3 className="nedbank-text-base mb-2">No Partners Found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No partners available at the moment'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ga">
          {filteredPartners.map(partner => (
            <PartnerCard
              key={partner.partner_id}
              partnerId={partner.partner_id}
              displayName={partner.display_name}
              category={partner.category}
              pointsRate={partner.points_rate}
              isActive={partner.is_active}
              showDetails={true}
              size="md"
            />
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      {selectedCategory === 'all' && filteredPartners.length > 0 && (
        <div className="nedbank-card">
          <h4 className="nedbank-text-base">Browse by Category</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ga">
            {categories.map(category => {
              const config = getCategoryConfig(category);
              const categoryPartners = partners.filter(p => p.category === category);
              const IconComponent = config.icon;
              
              return (
                <div
                  key={category}
                  className="-2 cursor-pointer hover:shadow-md transition-all"
                  style={{ 
                    backgroundColor: config.backgroundColor,
                    borderColor: selectedCategory === category ? config.color : 'transparent'
                  }}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="space-x-3 mb-2">
                    <div 
                      className="w-10 h-10"
                      style={{ backgroundColor: config.color + '20' }}
                    >
                      <IconComponent 
                        className="w-5 h-5"
                        style={{ color: config.color }}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <p className="nedbank-text-small">{categoryPartners.length} partners</p>
                    </div>
                  </div>
                  <p className="nedbank-text-small">{config.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

