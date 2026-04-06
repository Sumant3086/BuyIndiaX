import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Global Store with Zustand
export const useStore = create(
  persist(
    (set, get) => ({
      // Cart State
      cart: {
        items: [],
        total: 0,
      },
      
      // Optimistic UI State
      optimisticUpdates: {},
      
      // UI State
      isCartOpen: false,
      isSearchOpen: false,
      isMobileMenuOpen: false,
      
      // Theme State
      theme: 'light',
      
      // Recently Viewed Products
      recentlyViewed: [],
      
      // Wishlist
      wishlist: [],
      
      // Actions
      setCart: (cart) => set({ cart }),
      
      addToCartOptimistic: (product, quantity = 1) => {
        const currentCart = get().cart;
        const existingItem = currentCart.items.find(item => item.product._id === product._id);
        
        let newItems;
        if (existingItem) {
          newItems = currentCart.items.map(item =>
            item.product._id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...currentCart.items, { product, quantity, _id: Date.now().toString() }];
        }
        
        const newTotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        set({
          cart: { items: newItems, total: newTotal },
          optimisticUpdates: { ...get().optimisticUpdates, [`cart-${product._id}`]: 'pending' }
        });
      },
      
      updateCartItemOptimistic: (itemId, quantity) => {
        const currentCart = get().cart;
        const newItems = currentCart.items.map(item =>
          item._id === itemId ? { ...item, quantity } : item
        );
        const newTotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        set({
          cart: { items: newItems, total: newTotal },
          optimisticUpdates: { ...get().optimisticUpdates, [`cart-update-${itemId}`]: 'pending' }
        });
      },
      
      removeFromCartOptimistic: (itemId) => {
        const currentCart = get().cart;
        const newItems = currentCart.items.filter(item => item._id !== itemId);
        const newTotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        set({
          cart: { items: newItems, total: newTotal },
          optimisticUpdates: { ...get().optimisticUpdates, [`cart-remove-${itemId}`]: 'pending' }
        });
      },
      
      clearOptimisticUpdate: (key) => {
        const updates = { ...get().optimisticUpdates };
        delete updates[key];
        set({ optimisticUpdates: updates });
      },
      
      toggleCart: () => set({ isCartOpen: !get().isCartOpen }),
      closeCart: () => set({ isCartOpen: false }),
      openCart: () => set({ isCartOpen: true }),
      
      toggleSearch: () => set({ isSearchOpen: !get().isSearchOpen }),
      closeSearch: () => set({ isSearchOpen: false }),
      
      toggleMobileMenu: () => set({ isMobileMenuOpen: !get().isMobileMenuOpen }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      
      addToRecentlyViewed: (product) => {
        const current = get().recentlyViewed;
        const filtered = current.filter(p => p._id !== product._id);
        const updated = [product, ...filtered].slice(0, 10);
        set({ recentlyViewed: updated });
      },
      
      addToWishlist: (product) => {
        const current = get().wishlist;
        if (!current.find(p => p._id === product._id)) {
          set({ wishlist: [...current, product] });
        }
      },
      
      removeFromWishlist: (productId) => {
        set({ wishlist: get().wishlist.filter(p => p._id !== productId) });
      },
      
      isInWishlist: (productId) => {
        return get().wishlist.some(p => p._id === productId);
      },
    }),
    {
      name: 'buyindiax-storage',
      partialize: (state) => ({
        theme: state.theme,
        recentlyViewed: state.recentlyViewed,
        wishlist: state.wishlist,
      }),
    }
  )
);
