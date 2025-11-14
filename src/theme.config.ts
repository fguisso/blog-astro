export type FeaturedProject = {
	title: string;
	description: string;
	url: string;
	image: string;
};

export type ThemeConfig = {
	site: {
		title: string;
		description: string;
		url: string;
	};
	featuredProjects: FeaturedProject[];
};

export const themeConfig: ThemeConfig = {
	site: {
		title: 'Astro Blog',
		description: 'Welcome to my website!',
		url: 'https://guisso.dev/',
	},
	featuredProjects: [
		{
			title: 'sfer.nvim',
			description:
				'Plugin simples para Neovim visualizar arquivos SARIF, usado em fluxos CodeQL e integrado ao meu toolkit de AppSec.',
			url: 'https://github.com/fguisso/sfer.nvim',
			image: 'https://repository-images.githubusercontent.com/989809911/d0c07270-894a-404a-8f87-26e0f9e1dc22',
		},
		{
			title: 'Dojo Shield',
			description: 'Dinâmica de hands-on para treinar desenvolvimento seguro com missões guiadas e feedback em tempo real.',
			url: 'https://github.com/topics/dojo-shield',
			image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
		},
		{
			title: 'Home Lab',
			description: 'Infra doméstica onde rodo pipelines de AppSec, storage ZFS, Kubernetes e automações; mais detalhes na wiki.',
			url: 'https://wiki.guisso.dev/linux/homelab',
			image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
		},
	],
};
