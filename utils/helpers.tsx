import React from 'react';
import { Smartphone, Apple, Monitor, Box, LayoutGrid } from 'lucide-react';

export const formatExternalUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export const formatDownloads = (count: number) => {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M+';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K+';
    return count.toString();
};

export const getPlatformIcon = (platform: string) => {
    if (platform === 'Windows') return <Monitor size={14} className="text-blue-500" />;
    if (platform === 'Android') return <Smartphone size={14} className="text-green-500" />;
    return <LayoutGrid size={14} className="text-zinc-500" />;
};
