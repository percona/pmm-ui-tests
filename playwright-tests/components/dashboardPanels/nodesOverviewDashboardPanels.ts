export const NodesOverviewDashboardPanels = {
    // Overview
    nodes: { panelId: 326, name: 'Nodes', error: '1' },
    minNodeUptime: { panelId: 375, name: 'Min Node Uptime', error: 'N/A' },
    dBInstances: { panelId: 376, name: 'DB Instances', error: '1' }, // this may vary because of user role, needs to be made better.
    totalVirtualCpus: { panelId: 306, name: 'Total Virtual CPUs', error: '0' },
    totalRAM: { panelId: 309, name: 'Total RAM', error: 'N/A' },
    virtualMemoryTotal: { panelId: 310, name: 'Virtual Memory Total', error: 'N/A' },
    diskSpaceTotal: { panelId: 311, name: 'Disk Space Total', error: 'N/A' },
    // Environment Details
    regions: { panelId: 64, name: 'Regions', error: 'No data to show' },
    types: { panelId: 66, name: 'Types', error: 'No data to show' },
    environmentNodes: { panelId: 68, name: 'Nodes', error: 'No data to show' },
    // CPU
    cpuTopUsage: { panelId: 349, name: 'Top Usage', error: 'N/A' },
    cpuTopSteal: { panelId: 350, name: 'Top Steal', error: 'N/A' },
    cpuTopIOWait: { panelId: 351, name: 'Top I/O Wait', error: 'N/A' },
    cpuTopSaturation: { panelId: 353, name: 'Top Saturation', error: 'N/A' },
    cpuTopSwitches: { panelId: 354, name: 'Top Switches', error: 'N/A' },
    cpuTopLoad: { panelId: 308, name: 'Top Load', error: 'N/A' },
    cpuTopRunnableProcs: { panelId: 352, name: 'Top Runnable Procs', error: 'N/A' },
    cpuTopBlockedProcs: { panelId: 355, name: 'Top Blocked Procs', error: 'N/A' },
    // CPU Details
    top5CpuUsage: { panelId: 62, name: 'Top 5 CPU Usage', error: 'No data' },
    cpuUsage: { panelId: 216, name: 'CPU Usage', error: 'No data' },
    top5CpuSteal: { panelId: 329, name: 'Top 5 CPU Steal', error: 'No data' },
    cpuSteal: { panelId: 330, name: 'CPU Steal', error: 'No data' },
    top5CpuIOWait: { panelId: 331, name: 'Top 5 CPU I/O Wait', error: 'No data' },
    cpuIOWait: { panelId: 332, name: 'CPU I/O Wait', error: 'No data' },
    top5CpuSaturation: { panelId: 33, name: 'Top 5 CPU Saturation', error: 'No data' },
    cpuSaturation: { panelId: 313, name: 'CPU Saturation', error: 'No data' },
    top5ContextSwitches: { panelId: 101, name: 'Top 5 Context Switches', error: 'No data' },
    switches: { panelId: 316, name: 'Switches', error: 'No data' },
    top5RunnableProcesses: { panelId: 121, name: 'Top 5 Runnable Processes', error: 'No data' },
    runnableProcesses: { panelId: 318, name: 'Runnable Processes', error: 'No data' },
    top5BlockedProcesses: { panelId: 140, name: 'Top 5 Blocked Processes', error: 'No data' },
    blockedProcesses: { panelId: 320, name: 'Blocked Processes', error: 'No data' },
    // Memory & Swap
    minMemoryAvailable: { panelId: 307, name: 'Min Memory Available', error: 'N/A' },
    minVirtualMemoryAvailable : { panelId: 361, name: 'Min Virtual Memory Available ', error: 'N/A' },
    topFileCacheActiveMemory : { panelId: 382, name: 'Top File Cache Active Memory', error: 'N/A' },
    minSwapAvailable : { panelId: 362, name: 'Min Swap Available', error: 'N/A' },
    topSwapReads : { panelId: 360, name: 'Top Swap Reads', error: 'N/A' },
    topSwapWrites : { panelId: 363, name: 'Top Swap Writes', error: 'N/A' },
    // Memory & Swap Details
    freeMemoryPercent : { panelId: 336, name: 'Free Memory Percent', error: 'No Data' },
    availableVirtualMemoryPercent : { panelId: 338, name: 'Available Virtual Memory Percent', error: 'No Data' },
    freeSwapSpacePercent : { panelId: 337, name: 'Free Swap Space Percent', error: 'No Data' },
    top5UsedMemory: { panelId: 159, name: 'Top 5 Used Memory', error: 'No Data' },
    top5FreeMemory: { panelId: 29, name: 'Top 5 Free Memory', error: 'No Data' },
    top5UsedVirtualMemory: { panelId: 160, name: 'Top 5 Used Virtual Memory', error: 'No Data' },
    top5AvailableVirtualMemory: { panelId: 6, name: 'Top 5 Available Virtual Memory', error: 'No Data' },
    top5UsedSwapSpace: { panelId: 23, name: 'Top 5 Used Swap Space', error: 'No Data' },
    top5FreeSwapSpace: { panelId: 161, name: 'Top 5 Free Swap Space', error: 'No Data' },
    top5SwapInReads: { panelId: 30, name: 'Top 5 Swap In (Reads)', error: 'No Data' },
    top5SwapOutWrites: { panelId: 162, name: 'Top 5 Swap Out (Writes)', error: 'No Data' },
    // Disk
    minFreeSpaceAvailable: { panelId: 312, name: 'Min Free Space Available', error: 'N/A' },
    topIOLoad: { panelId: 364, name: 'Top I/O Load', error: 'N/A' },
    topDiskLatency: { panelId: 365, name: ' Top Disk Latency', error: 'N/A' },
    topDiskOperations: { panelId: 383, name: ' Top Disk Operations', error: 'N/A' },
    topDiskBandwidth: { panelId: 366, name: ' Top Disk Bandwidth', error: 'N/A' },
    topIOActivity: { panelId: 367, name: ' Top I/O Activity', error: 'N/A' },
    // Disk Details
    top5DiskIOLoad: { panelId: 51, name: 'Top 5 Disk I/O Load', error: 'No data' },
    diskIOLoad: { panelId: 339, name: 'Disk I/O Load', error: 'No data' },
    top5DiskLatency: { panelId: 167, name: 'Top 5 Disk Latency', error: 'No data' },
    diskLatency: { panelId: 340, name: ' Disk Latency', error: 'No data' },
    top5DiskBandwidth: { panelId: 31, name: 'Top 5 Disk Bandwidth', error: 'No data' },
    diskBandwidth: { panelId: 341, name: ' Disk Bandwidth', error: 'No data' },
    top5IOActivity: { panelId: 342, name: 'Top 5 I/O Activity', error: 'No data' },
    IOActivity: { panelId: 343, name: 'I/O Activity', error: 'No data' },
    // Network
    topReceiveNetworkTraffic: { panelId: 370, name: ' Top Receive Network Traffic', error: 'N/A' },
    topTransmitNetworkTraffic: { panelId: 374, name: ' Top Transmit Network Traffic', error: 'N/A' },
    topErrors: { panelId: 371, name: 'Top Errors', error: 'N/A' },
    topDrop: { panelId: 373, name: 'Top Drop', error: 'N/A' },
    topRetransmission: { panelId: 372, name: 'Top Retransmission', error: 'N/A' },
    topRetransmitRate: { panelId: 381, name: 'Top Retransmit rate', error: 'N/A' },
    // Network Details
    top5NetworkTraffic: { panelId: 21, name: 'Top 5 Network Traffic', error: 'No data' },
    networkTraffic: { panelId: 303, name: 'Network Traffic', error: 'No data' },
    top5LocalNetworkErrors: { panelId: 52, name: 'Top 5 Local Network Errors', error: 'No data' },
    errors: { panelId: 324, name: 'Errors', error: 'No data' },
    top5TCPRetransmission: { panelId: 53, name: 'Top 5 TCP Retransmission', error: 'No data' },
    retransmission: { panelId: 322, name: 'Retransmission', error: 'No data' },
    top5LocalNetworkDrop: { panelId: 168, name: 'Top 5 Local Network Drop', error: 'No data' },
    drop: { panelId: 323, name: 'Drop', error: 'No data' },
}